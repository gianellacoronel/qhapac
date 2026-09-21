/**
 * Server-only purchase orchestration. Import from Route Handlers only.
 */
import {
  PurchaseConfigError,
  PurchaseSubmitError,
  PurchaseValidationError,
  submitQrpPurchase,
} from "@/lib/stellar/purchase";

export type PurchaseParticipationSuccess = {
  success: true;
  transactionHash: string;
  explorerUrl: string;
  amount: string;
  investorAddress: string;
};

export type PurchaseParticipationFailure = {
  success: false;
  error:
    | "invalid_address"
    | "invalid_amount"
    | "no_trustline"
    | "insufficient_distributor"
    | "account_not_found"
    | "config"
    | "stellar_submit"
    | "unknown";
  message: string;
};

export type PurchaseParticipationResult =
  | PurchaseParticipationSuccess
  | PurchaseParticipationFailure;

/**
 * Validate request + send real QRP from the distributor to the investor.
 */
export async function purchaseParticipationOnChain(params: {
  investorAddress: unknown;
  amount: unknown;
}): Promise<PurchaseParticipationResult> {
  try {
    const result = await submitQrpPurchase({
      investorAddress: params.investorAddress as string,
      amount: params.amount as string,
    });

    return {
      success: true,
      transactionHash: result.hash,
      explorerUrl: result.explorerUrl,
      amount: result.amount,
      investorAddress: result.investorAddress,
    };
  } catch (error: unknown) {
    if (error instanceof PurchaseValidationError) {
      switch (error.code) {
        case "INVALID_ADDRESS":
          return {
            success: false,
            error: "invalid_address",
            message: error.message,
          };
        case "INVALID_AMOUNT":
          return {
            success: false,
            error: "invalid_amount",
            message: error.message,
          };
        case "NO_TRUSTLINE":
          return {
            success: false,
            error: "no_trustline",
            message: error.message,
          };
        case "INSUFFICIENT_DISTRIBUTOR":
          return {
            success: false,
            error: "insufficient_distributor",
            message: error.message,
          };
        case "ACCOUNT_NOT_FOUND":
          return {
            success: false,
            error: "account_not_found",
            message: error.message,
          };
      }
    }

    if (error instanceof PurchaseConfigError) {
      return {
        success: false,
        error: "config",
        message:
          "QRP purchase is not configured on the server. Set distributor env vars and restart.",
      };
    }

    if (error instanceof PurchaseSubmitError) {
      return {
        success: false,
        error: "stellar_submit",
        message:
          "We couldn't complete the QRP purchase on Stellar. Please try again.",
      };
    }

    return {
      success: false,
      error: "unknown",
      message:
        "We couldn't complete the QRP purchase on Stellar. Please try again.",
    };
  }
}
