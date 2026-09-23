/**
 * Client helper for Admin milestone approval against Pinata + Stellar Testnet.
 * Never handles secret keys (PINATA_JWT, QHAPAQ_ADMIN_SECRET_KEY).
 */
import type { MilestoneEvidence } from "./types";

export type ApproveMilestoneApiSuccess = {
  success: true;
  milestoneId: string;
  transactionHash: string;
  explorerUrl: string;
  approvedBy: string;
  approvedAt: string;
  approvalMemo?: string;
  evidence: MilestoneEvidence;
};

export type ApproveMilestoneApiFailure = {
  success: false;
  error?:
    | "invalid_milestone"
    | "invalid_description"
    | "invalid_file"
    | "file_too_large"
    | "already_approved"
    | "in_progress"
    | "config"
    | "pinata_upload"
    | "stellar_submit"
    | "unknown";
  message?: string;
};

export type ApproveMilestoneClientResult =
  | {
      ok: true;
      milestoneId: string;
      transactionHash: string;
      explorerUrl: string;
      approvedBy: string;
      approvedAt: string;
      approvalMemo?: string;
      evidence: MilestoneEvidence;
    }
  | {
      ok: false;
      error:
        | "invalid_milestone"
        | "invalid_description"
        | "invalid_file"
        | "file_too_large"
        | "already_approved"
        | "in_progress"
        | "config"
        | "pinata_upload"
        | "stellar_submit"
        | "network"
        | "unknown";
      message: string;
    };

type ClientErrorCode = Extract<
  ApproveMilestoneClientResult,
  { ok: false }
>["error"];

function normalizeErrorCode(error: unknown): ClientErrorCode {
  switch (error) {
    case "invalid_milestone":
    case "invalid_description":
    case "invalid_file":
    case "file_too_large":
    case "already_approved":
    case "in_progress":
    case "config":
    case "pinata_upload":
    case "stellar_submit":
    case "network":
      return error;
    default:
      return "unknown";
  }
}

export async function requestMilestoneApproval(input: {
  milestoneId: string;
  description: string;
  file: File;
}): Promise<ApproveMilestoneClientResult> {
  const body = new FormData();
  body.set("milestoneId", input.milestoneId);
  body.set("description", input.description);
  body.set("file", input.file);

  let response: Response;
  try {
    response = await fetch("/api/admin/milestones/approve", {
      method: "POST",
      body,
    });
  } catch {
    return {
      ok: false,
      error: "network",
      message: "Network error while approving the milestone. Please try again.",
    };
  }

  let payload: ApproveMilestoneApiSuccess | ApproveMilestoneApiFailure;
  try {
    payload = (await response.json()) as
      | ApproveMilestoneApiSuccess
      | ApproveMilestoneApiFailure;
  } catch {
    return {
      ok: false,
      error: "unknown",
      message:
        "The approval could not be recorded. The milestone is still pending.",
    };
  }

  if (!response.ok || !payload.success) {
    const failure = payload as ApproveMilestoneApiFailure;
    return {
      ok: false,
      error: normalizeErrorCode(failure.error),
      message:
        failure.message?.trim() ||
        "The approval could not be recorded. The milestone is still pending.",
    };
  }

  const success = payload as ApproveMilestoneApiSuccess;
  if (
    !success.evidence ||
    typeof success.evidence.cid !== "string" ||
    typeof success.evidence.contentHash !== "string"
  ) {
    return {
      ok: false,
      error: "unknown",
      message:
        "The approval could not be recorded. The milestone is still pending.",
    };
  }

  return {
    ok: true,
    milestoneId: success.milestoneId,
    transactionHash: success.transactionHash,
    explorerUrl: success.explorerUrl,
    approvedBy: success.approvedBy,
    approvedAt: success.approvedAt,
    approvalMemo: success.approvalMemo,
    evidence: success.evidence,
  };
}

export type MilestoneListApiResponse = {
  milestones: Array<{
    id: string;
    status: "pending" | "approved";
    expectedDate?: string;
    approvedAt?: string;
    approvedBy?: string;
    transactionHash?: string;
    approvalMemo?: string;
    evidence?: MilestoneEvidence;
  }>;
};

export async function fetchMilestonesFromServer(): Promise<
  MilestoneListApiResponse["milestones"] | null
> {
  try {
    const response = await fetch("/api/milestones", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as MilestoneListApiResponse;
    if (!Array.isArray(payload.milestones)) return null;
    return payload.milestones;
  } catch {
    return null;
  }
}
