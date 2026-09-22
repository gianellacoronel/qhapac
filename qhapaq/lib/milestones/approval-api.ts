/**
 * Server-only milestone approval orchestration. Import from Route Handlers only.
 *
 * AUTH LIMITATION (hackathon prototype):
 * This endpoint is not cryptographically authenticated. The Admin Wallet secret
 * signs the Stellar proof on the server, but any caller who can reach the API
 * can trigger an approval for a pending milestone. UI gating (Freighter +
 * NEXT_PUBLIC_QRP_ADMIN) is client-side only — do not treat this as server auth.
 */
import {
  abortMilestoneApproval,
  beginMilestoneApproval,
  completeMilestoneApproval,
  getStoredMilestone,
  isMilestoneApprovalInFlight,
} from "@/lib/milestones/approval-store";
import {
  MilestoneApprovalConfigError,
  MilestoneApprovalSubmitError,
  submitMilestoneApprovalProof,
} from "@/lib/stellar/milestone-approval";

export type ApproveMilestoneSuccess = {
  success: true;
  milestoneId: string;
  transactionHash: string;
  explorerUrl: string;
  approvedBy: string;
  approvedAt: string;
};

export type ApproveMilestoneFailure = {
  success: false;
  error:
    | "invalid_milestone"
    | "already_approved"
    | "in_progress"
    | "config"
    | "stellar_submit"
    | "unknown";
  message: string;
};

export type ApproveMilestoneResult =
  | ApproveMilestoneSuccess
  | ApproveMilestoneFailure;

/**
 * Validate + record a milestone approval with a real Stellar Testnet proof.
 * Status becomes approved only after a successful Stellar submit.
 */
export async function approveMilestoneOnChain(
  rawMilestoneId: unknown
): Promise<ApproveMilestoneResult> {
  if (typeof rawMilestoneId !== "string" || !rawMilestoneId.trim()) {
    return {
      success: false,
      error: "invalid_milestone",
      message: "This milestone could not be found.",
    };
  }

  const milestoneId = rawMilestoneId.trim();
  const existing = getStoredMilestone(milestoneId);

  if (!existing) {
    return {
      success: false,
      error: "invalid_milestone",
      message: "This milestone could not be found.",
    };
  }

  if (existing.status === "approved") {
    return {
      success: false,
      error: "already_approved",
      message: "This milestone has already been approved.",
    };
  }

  if (isMilestoneApprovalInFlight(milestoneId)) {
    return {
      success: false,
      error: "in_progress",
      message: "This milestone approval is already in progress.",
    };
  }

  const started = beginMilestoneApproval(milestoneId);
  if (!started) {
    const again = getStoredMilestone(milestoneId);
    if (again?.status === "approved") {
      return {
        success: false,
        error: "already_approved",
        message: "This milestone has already been approved.",
      };
    }
    return {
      success: false,
      error: "in_progress",
      message: "This milestone approval is already in progress.",
    };
  }

  try {
    const proof = await submitMilestoneApprovalProof(milestoneId);
    const approvedAt = new Date().toISOString();
    const completed = completeMilestoneApproval(milestoneId, {
      approvedBy: proof.approvedBy,
      approvedAt,
      transactionHash: proof.hash,
    });

    if (!completed) {
      abortMilestoneApproval(milestoneId);
      return {
        success: false,
        error: "unknown",
        message:
          "We couldn't record the milestone approval on Stellar. Please try again.",
      };
    }

    return {
      success: true,
      milestoneId,
      transactionHash: proof.hash,
      explorerUrl: proof.explorerUrl,
      approvedBy: proof.approvedBy,
      approvedAt,
    };
  } catch (error: unknown) {
    abortMilestoneApproval(milestoneId);

    if (error instanceof MilestoneApprovalConfigError) {
      return {
        success: false,
        error: "config",
        message:
          "Milestone approval is not configured on the server. Set QHAPAQ_ADMIN_SECRET_KEY and restart.",
      };
    }

    if (error instanceof MilestoneApprovalSubmitError) {
      return {
        success: false,
        error: "stellar_submit",
        message:
          "We couldn't record the milestone approval on Stellar. Please try again.",
      };
    }

    return {
      success: false,
      error: "unknown",
      message:
        "We couldn't record the milestone approval on Stellar. Please try again.",
    };
  }
}
