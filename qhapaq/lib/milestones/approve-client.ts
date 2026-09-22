/**
 * Client helper for Admin milestone approval against Stellar Testnet.
 * Never handles secret keys.
 */

export type ApproveMilestoneApiSuccess = {
  success: true;
  milestoneId: string;
  transactionHash: string;
  explorerUrl: string;
  approvedBy: string;
  approvedAt: string;
};

export type ApproveMilestoneApiFailure = {
  success: false;
  error?:
    | "invalid_milestone"
    | "already_approved"
    | "in_progress"
    | "config"
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
    }
  | {
      ok: false;
      error:
        | "invalid_milestone"
        | "already_approved"
        | "in_progress"
        | "config"
        | "stellar_submit"
        | "network"
        | "unknown";
      message: string;
    };

export async function requestMilestoneApproval(
  milestoneId: string
): Promise<ApproveMilestoneClientResult> {
  let response: Response;
  try {
    response = await fetch("/api/admin/milestones/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId }),
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
        "We couldn't record the milestone approval on Stellar. Please try again.",
    };
  }

  if (!response.ok || !payload.success) {
    const failure = payload as ApproveMilestoneApiFailure;
    const error =
      failure.error === "invalid_milestone" ||
      failure.error === "already_approved" ||
      failure.error === "in_progress" ||
      failure.error === "config" ||
      failure.error === "stellar_submit"
        ? failure.error
        : "unknown";

    return {
      ok: false,
      error,
      message:
        failure.message?.trim() ||
        "We couldn't record the milestone approval on Stellar. Please try again.",
    };
  }

  const success = payload as ApproveMilestoneApiSuccess;
  return {
    ok: true,
    milestoneId: success.milestoneId,
    transactionHash: success.transactionHash,
    explorerUrl: success.explorerUrl,
    approvedBy: success.approvedBy,
    approvedAt: success.approvedAt,
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
    evidence?: { mock: true };
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
