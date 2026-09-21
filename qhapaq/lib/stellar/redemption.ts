/**
 * Server-only Stellar redemption helpers.
 * Import exclusively from Route Handlers / Server Actions — never from client components.
 */
import {
  Asset,
  BASE_FEE,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from "stellar-sdk";
import { getHorizonServer, stellarConfig } from "./config";
import { getTransactionExplorerUrl } from "./explorer";

/** Public address of the Qhapaq Redemption Wallet (safe to expose). */
export const QHAPAQ_REDEMPTION_PUBLIC_KEY =
  "GBSJSL5AIHOZFKD4HVAQEKKD3T3PXDQUOWB7RMUGPLBCDXK4XWY6GBYC";

/** Tiny native XLM self-payment used as on-chain redemption proof. */
export const REDEMPTION_XLM_AMOUNT = "0.0001";

export class RedemptionConfigError extends Error {
  readonly code = "CONFIG" as const;

  constructor(message: string) {
    super(message);
    this.name = "RedemptionConfigError";
  }
}

export class RedemptionSubmitError extends Error {
  readonly code = "SUBMIT" as const;

  constructor(message: string) {
    super(message);
    this.name = "RedemptionSubmitError";
  }
}

export type RedemptionProofResult = {
  hash: string;
  explorerUrl: string;
  benefitId: string;
};

function loadRedemptionKeypair(): Keypair {
  const secret = process.env.QHAPAQ_REDEMPTION_SECRET_KEY?.trim();
  if (!secret) {
    throw new RedemptionConfigError(
      "Missing QHAPAQ_REDEMPTION_SECRET_KEY server environment variable."
    );
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecret(secret);
  } catch {
    throw new RedemptionConfigError(
      "QHAPAQ_REDEMPTION_SECRET_KEY is not a valid Stellar secret key."
    );
  }

  if (keypair.publicKey() !== QHAPAQ_REDEMPTION_PUBLIC_KEY) {
    throw new RedemptionConfigError(
      "Redemption wallet configuration does not match the expected public address."
    );
  }

  return keypair;
}

function toSubmitErrorMessage(error: unknown): string {
  const horizonError = error as {
    response?: {
      data?: {
        extras?: {
          result_codes?: {
            transaction?: string;
            operations?: string[];
          };
        };
        title?: string;
        detail?: string;
      };
    };
    message?: string;
  };

  const codes = horizonError.response?.data?.extras?.result_codes;
  if (codes) {
    const ops = codes.operations?.join(", ");
    return `Transaction rejected (${codes.transaction ?? "unknown"}${
      ops ? `: ${ops}` : ""
    }).`;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Failed to submit redemption transaction to Stellar.";
}

/**
 * Build, sign (server-side), and submit a Testnet proof transaction.
 * Memo carries the Benefit ID. Does not transfer QRP.
 * Never logs or returns the secret key.
 */
export async function submitBenefitRedemptionProof(
  benefitId: string
): Promise<RedemptionProofResult> {
  const keypair = loadRedemptionKeypair();
  const horizon = getHorizonServer();

  let account;
  try {
    account = await horizon.loadAccount(keypair.publicKey());
  } catch {
    throw new RedemptionSubmitError(
      "Could not load the Qhapaq Redemption Wallet on Stellar Testnet."
    );
  }

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: stellarConfig.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: keypair.publicKey(),
        asset: Asset.native(),
        amount: REDEMPTION_XLM_AMOUNT,
      })
    )
    .addMemo(Memo.text(benefitId))
    .setTimeout(180)
    .build();

  transaction.sign(keypair);

  try {
    const response = await horizon.submitTransaction(transaction);
    return {
      hash: response.hash,
      explorerUrl: getTransactionExplorerUrl(response.hash),
      benefitId,
    };
  } catch (error: unknown) {
    throw new RedemptionSubmitError(toSubmitErrorMessage(error));
  }
}
