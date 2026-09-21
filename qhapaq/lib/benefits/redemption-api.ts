/**
 * Server-only redeem orchestration. Import from Route Handlers only.
 */
import { isValidBenefitId, normalizeBenefitId } from "@/lib/benefits/utils";
import {
  abortRedemption,
  beginRedemption,
  completeRedemption,
  getStoredRedemption,
} from "@/lib/benefits/redemption-store";
import {
  RedemptionConfigError,
  RedemptionSubmitError,
  submitBenefitRedemptionProof,
} from "@/lib/stellar/redemption";

export type RedeemBenefitSuccess = {
  success: true;
  benefitId: string;
  transactionHash: string;
  explorerUrl: string;
};

export type RedeemBenefitFailure = {
  success: false;
  error:
    | "invalid_benefit"
    | "already_redeemed"
    | "config"
    | "stellar_submit"
    | "unknown";
  message: string;
};

export type RedeemBenefitResult = RedeemBenefitSuccess | RedeemBenefitFailure;

/**
 * Validate + record a benefit redemption with a real Stellar Testnet proof.
 */
export async function redeemBenefitOnChain(
  rawBenefitId: unknown
): Promise<RedeemBenefitResult> {
  if (typeof rawBenefitId !== "string") {
    return {
      success: false,
      error: "invalid_benefit",
      message: "This benefit could not be verified.",
    };
  }

  const benefitId = normalizeBenefitId(rawBenefitId);
  if (!isValidBenefitId(benefitId)) {
    return {
      success: false,
      error: "invalid_benefit",
      message: "This benefit could not be verified.",
    };
  }

  const existing = getStoredRedemption(benefitId);
  if (existing?.status === "redeemed") {
    return {
      success: false,
      error: "already_redeemed",
      message: "This benefit has already been redeemed.",
    };
  }

  if (existing?.status === "redeeming") {
    return {
      success: false,
      error: "already_redeemed",
      message: "This benefit has already been redeemed.",
    };
  }

  const started = beginRedemption(benefitId);
  if (!started) {
    return {
      success: false,
      error: "already_redeemed",
      message: "This benefit has already been redeemed.",
    };
  }

  try {
    const proof = await submitBenefitRedemptionProof(benefitId);
    completeRedemption(benefitId, {
      transactionHash: proof.hash,
      explorerUrl: proof.explorerUrl,
    });

    return {
      success: true,
      benefitId,
      transactionHash: proof.hash,
      explorerUrl: proof.explorerUrl,
    };
  } catch (error: unknown) {
    abortRedemption(benefitId);

    if (error instanceof RedemptionConfigError) {
      return {
        success: false,
        error: "config",
        message:
          "Redemption is not configured on the server. Set QHAPAQ_REDEMPTION_SECRET_KEY and restart.",
      };
    }

    if (error instanceof RedemptionSubmitError) {
      return {
        success: false,
        error: "stellar_submit",
        message:
          "We couldn't record the redemption on Stellar. Please try again.",
      };
    }

    return {
      success: false,
      error: "unknown",
      message:
        "We couldn't record the redemption on Stellar. Please try again.",
    };
  }
}
