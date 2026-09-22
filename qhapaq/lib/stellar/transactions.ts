import { signTransaction } from "@stellar/freighter-api";
import {
  Asset,
  BASE_FEE,
  Memo,
  Operation,
  TransactionBuilder,
  type Transaction,
} from "stellar-sdk";
import { fetchQrpBalance, getQrpAsset } from "./assets";
import { getHorizonServer, stellarConfig } from "./config";
import { getTransactionExplorerUrl } from "./explorer";

/** Tiny native XLM amount for the harmless Testnet smoke-test payment. */
export const TEST_XLM_AMOUNT = "0.0001";

export type SubmitResult = {
  hash: string;
  ledger: number;
};

export type TransactionPhase = "building" | "signing" | "submitting";

export type TrustlinePhase =
  | "building"
  | "signing"
  | "submitting"
  | "confirming";

export type TrustlineErrorCode =
  | "CANCELLED"
  | "INSUFFICIENT_XLM"
  | "NOT_CONFIRMED"
  | "SUBMIT"
  | "UNEXPECTED";

export class TrustlineError extends Error {
  readonly code: TrustlineErrorCode;

  constructor(code: TrustlineErrorCode, message: string) {
    super(message);
    this.name = "TrustlineError";
    this.code = code;
  }
}

export type BuildPaymentParams = {
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  /** Defaults to classic QRP for invest flows. Pass Asset.native() for XLM. */
  asset?: Asset;
  memo?: string;
};

export type SendPaymentParams = BuildPaymentParams & {
  onPhaseChange?: (phase: TransactionPhase) => void;
};

export type CreateQrpTrustlineParams = {
  sourceAddress: string;
  onPhaseChange?: (phase: TrustlinePhase) => void;
};

export type CreateQrpTrustlineResult = {
  hash: string | null;
  ledger: number | null;
  explorerUrl: string | null;
  alreadyExisted: boolean;
};

function freighterErrorMessage(
  error: { message?: string } | undefined,
  fallback: string
): string {
  return error?.message?.trim() || fallback;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function getHorizonResultCodes(error: unknown): {
  transaction?: string;
  operations?: string[];
} | null {
  const horizonError = error as {
    response?: {
      data?: {
        extras?: {
          result_codes?: {
            transaction?: string;
            operations?: string[];
          };
        };
      };
    };
    message?: string;
  };

  const codes = horizonError.response?.data?.extras?.result_codes;
  if (codes) return codes;

  const message = toErrorMessage(error, "");
  if (!message.includes("Transaction rejected")) return null;

  const opsMatch = message.match(/: ([a-z0-9_, ]+)\)\.?$/i);
  const txMatch = message.match(/Transaction rejected \(([^:)]+)/i);

  return {
    transaction: txMatch?.[1]?.trim(),
    operations: opsMatch?.[1]
      ?.split(",")
      .map((op) => op.trim())
      .filter(Boolean),
  };
}

function isInsufficientXlmError(error: unknown): boolean {
  const codes = getHorizonResultCodes(error);
  const ops = codes?.operations?.join(" ") ?? "";
  const tx = codes?.transaction ?? "";
  const message = toErrorMessage(error, "").toLowerCase();

  return (
    ops.includes("op_low_reserve") ||
    ops.includes("op_underfunded") ||
    tx === "insufficient_balance" ||
    message.includes("op_low_reserve") ||
    message.includes("op_underfunded") ||
    message.includes("low reserve")
  );
}

function isFreighterCancellation(error: unknown): boolean {
  const message = toErrorMessage(error, "").toLowerCase();
  return (
    message.includes("reject") ||
    message.includes("denied") ||
    message.includes("declin") ||
    message.includes("cancel") ||
    message.includes("user refused")
  );
}

async function waitForQrpTrustline(
  publicKey: string,
  options?: { attempts?: number; delayMs?: number }
): Promise<boolean> {
  const attempts = options?.attempts ?? 6;
  const delayMs = options?.delayMs ?? 800;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const balance = await fetchQrpBalance(publicKey);
    if (balance.hasTrustline) {
      return true;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

/** Build an unsigned classic payment transaction as base64 XDR. */
export async function buildPaymentTransaction(
  params: BuildPaymentParams
): Promise<string> {
  const horizon = getHorizonServer();
  const account = await horizon.loadAccount(params.sourceAddress);
  const asset = params.asset ?? getQrpAsset();

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: stellarConfig.networkPassphrase,
  }).addOperation(
    Operation.payment({
      destination: params.destinationAddress,
      asset,
      amount: params.amount,
    })
  );

  if (params.memo) {
    builder.addMemo(Memo.text(params.memo));
  }

  return builder.setTimeout(180).build().toXDR();
}

/** Sign a transaction XDR with Freighter (public-key signing only). */
export async function signWithFreighter(
  unsignedXdr: string,
  address?: string
): Promise<string> {
  const result = await signTransaction(unsignedXdr, {
    networkPassphrase: stellarConfig.networkPassphrase,
    address,
  });

  if (result.error) {
    throw new Error(
      freighterErrorMessage(result.error, "Freighter signing failed.")
    );
  }

  if (!result.signedTxXdr) {
    throw new Error("Freighter did not return a signed transaction.");
  }

  return result.signedTxXdr;
}

/** Submit a signed classic transaction to Stellar Horizon. */
export async function submitSignedTransaction(
  signedXdr: string
): Promise<SubmitResult> {
  const horizon = getHorizonServer();
  const transaction = TransactionBuilder.fromXDR(
    signedXdr,
    stellarConfig.networkPassphrase
  ) as Transaction;

  try {
    const response = await horizon.submitTransaction(transaction);
    return {
      hash: response.hash,
      ledger: response.ledger,
    };
  } catch (error: unknown) {
    const horizonError = error as {
      response?: {
        data?: {
          extras?: {
            result_codes?: {
              transaction?: string;
              operations?: string[];
            };
          };
        };
      };
      message?: string;
    };

    const codes = horizonError.response?.data?.extras?.result_codes;
    if (codes) {
      const ops = codes.operations?.join(", ");
      throw new Error(
        `Transaction rejected (${codes.transaction ?? "unknown"}${
          ops ? `: ${ops}` : ""
        }).`
      );
    }

    throw new Error(
      horizonError.message ?? "Failed to submit transaction to Stellar."
    );
  }
}

/**
 * Build → sign with Freighter → submit.
 * Never handles private keys. Does not run unless explicitly invoked.
 */
export async function sendClassicPayment(
  params: SendPaymentParams
): Promise<SubmitResult> {
  const { onPhaseChange, ...payment } = params;

  try {
    onPhaseChange?.("building");
    const unsignedXdr = await buildPaymentTransaction(payment);

    onPhaseChange?.("signing");
    const signedXdr = await signWithFreighter(
      unsignedXdr,
      payment.sourceAddress
    );

    onPhaseChange?.("submitting");
    return await submitSignedTransaction(signedXdr);
  } catch (error: unknown) {
    throw new Error(
      toErrorMessage(error, "Transaction failed. Please try again.")
    );
  }
}

/**
 * Harmless Stellar Testnet smoke test: tiny native XLM self-payment.
 * Does not touch QRP. Requires an explicit user action to start.
 */
export async function sendTestXlmPayment(
  sourceAddress: string,
  options?: {
    onPhaseChange?: (phase: TransactionPhase) => void;
  }
): Promise<SubmitResult> {
  return sendClassicPayment({
    sourceAddress,
    destinationAddress: sourceAddress,
    amount: TEST_XLM_AMOUNT,
    asset: Asset.native(),
    memo: "Qhapaq test",
    onPhaseChange: options?.onPhaseChange,
  });
}

/** Build an unsigned changeTrust(QRP) transaction as base64 XDR. */
export async function buildQrpChangeTrustTransaction(
  sourceAddress: string
): Promise<string> {
  const horizon = getHorizonServer();
  const account = await horizon.loadAccount(sourceAddress);

  return new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: stellarConfig.networkPassphrase,
  })
    .addOperation(
      Operation.changeTrust({
        asset: getQrpAsset(),
      })
    )
    .addMemo(Memo.text("Qhapaq QRP"))
    .setTimeout(180)
    .build()
    .toXDR();
}

/**
 * Build → sign with Freighter → submit changeTrust(QRP), then verify on Horizon.
 * Never handles private keys. Does not run unless explicitly invoked by the user.
 */
export async function createQrpTrustline(
  params: CreateQrpTrustlineParams
): Promise<CreateQrpTrustlineResult> {
  const { sourceAddress, onPhaseChange } = params;

  try {
    const existing = await fetchQrpBalance(sourceAddress);
    if (existing.hasTrustline) {
      return {
        hash: null,
        ledger: null,
        explorerUrl: null,
        alreadyExisted: true,
      };
    }

    onPhaseChange?.("building");
    const unsignedXdr = await buildQrpChangeTrustTransaction(sourceAddress);

    onPhaseChange?.("signing");
    let signedXdr: string;
    try {
      signedXdr = await signWithFreighter(unsignedXdr, sourceAddress);
    } catch (error: unknown) {
      if (isFreighterCancellation(error)) {
        throw new TrustlineError(
          "CANCELLED",
          "Freighter signing was cancelled."
        );
      }
      throw error;
    }

    onPhaseChange?.("submitting");
    let submitted: SubmitResult;
    try {
      submitted = await submitSignedTransaction(signedXdr);
    } catch (error: unknown) {
      if (isInsufficientXlmError(error)) {
        throw new TrustlineError(
          "INSUFFICIENT_XLM",
          "Not enough XLM to cover Stellar reserves for adding QRP."
        );
      }
      throw new TrustlineError(
        "SUBMIT",
        toErrorMessage(error, "Failed to submit trustline transaction.")
      );
    }

    onPhaseChange?.("confirming");
    const confirmed = await waitForQrpTrustline(sourceAddress);
    if (!confirmed) {
      throw new TrustlineError(
        "NOT_CONFIRMED",
        "Trustline was submitted but QRP is not visible on Stellar yet."
      );
    }

    return {
      hash: submitted.hash,
      ledger: submitted.ledger,
      explorerUrl: getTransactionExplorerUrl(submitted.hash),
      alreadyExisted: false,
    };
  } catch (error: unknown) {
    if (error instanceof TrustlineError) {
      throw error;
    }

    if (isFreighterCancellation(error)) {
      throw new TrustlineError(
        "CANCELLED",
        "Freighter signing was cancelled."
      );
    }

    if (isInsufficientXlmError(error)) {
      throw new TrustlineError(
        "INSUFFICIENT_XLM",
        "Not enough XLM to cover Stellar reserves for adding QRP."
      );
    }

    throw new TrustlineError(
      "UNEXPECTED",
      toErrorMessage(error, "Could not add QRP to your wallet.")
    );
  }
}
