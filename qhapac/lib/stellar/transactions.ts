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

export type SubmitResult = {
  hash: string;
  ledger: number;
};

export type BuildPaymentParams = {
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  asset?: Asset;
  memo?: string;
};

function freighterErrorMessage(
  error: { message?: string } | undefined,
  fallback: string
): string {
  return error?.message?.trim() || fallback;
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
 * Intended for a future Invest flow; does not run on wallet connect.
 */
export async function sendClassicPayment(
  params: BuildPaymentParams
): Promise<SubmitResult> {
  const unsignedXdr = await buildPaymentTransaction(params);
  const signedXdr = await signWithFreighter(unsignedXdr, params.sourceAddress);
  return submitSignedTransaction(signedXdr);
}
