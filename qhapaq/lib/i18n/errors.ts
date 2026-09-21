/**
 * Maps purchase API error codes to translation keys under purchase.errors.*
 */
export function purchaseErrorKey(errorCode: string | undefined): string {
  switch (errorCode) {
    case "invalid_address":
    case "INVALID_ADDRESS":
      return "errors.invalid_address";
    case "invalid_amount":
    case "INVALID_AMOUNT":
      return "errors.invalid_amount";
    case "no_trustline":
    case "NO_TRUSTLINE":
      return "errors.no_trustline";
    case "insufficient_distributor":
    case "INSUFFICIENT_DISTRIBUTOR":
      return "errors.insufficient_distributor";
    case "account_not_found":
    case "ACCOUNT_NOT_FOUND":
      return "errors.account_not_found";
    case "config":
      return "errors.config";
    case "submit_failed":
    case "stellar_submit":
      return "errors.submit_failed";
    default:
      return "errors.unknown";
  }
}

/**
 * Maps redemption session/API error codes to translation keys under benefits.errors.*
 */
export function redemptionErrorKey(errorCode: string | undefined): string {
  switch (errorCode) {
    case "not_found":
    case "invalid_benefit":
      return "errors.not_found";
    case "already_redeemed":
      return "errors.already_redeemed";
    case "in_progress":
      return "errors.in_progress";
    case "not_configured":
      return "errors.not_configured";
    case "submit_failed":
      return "errors.submit_failed";
    default:
      return "errors.submit_failed";
  }
}
