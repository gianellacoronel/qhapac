import { signTransaction } from "@stellar/freighter-api";
import {
  Asset,
  BASE_FEE,
  Memo,
  Operation,
  TransactionBuilder,
  type Transaction,
} from "stellar-sdk";
import { getQrpAsset } from "./assets";
import { getHorizonServer, stellarConfig } from "./config";

/** Tiny native XLM amount for the harmless Testnet smoke-test payment. */
export const TEST_XLM_AMOUNT = "0.0001";

export type SubmitResult = {
  hash: string;
  ledger: number;
};

export type TransactionPhase = "building" | "signing" | "submitting";

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
