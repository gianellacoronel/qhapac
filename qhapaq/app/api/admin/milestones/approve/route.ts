import { NextResponse } from "next/server";
import { approveMilestoneOnChain } from "@/lib/milestones/approval-api";

export const runtime = "nodejs";

/**
 * POST /api/admin/milestones/approve
 *
 * AUTH LIMITATION: No cryptographic admin session. Anyone who can call this
 * route may trigger a server-signed Admin Wallet proof for a pending milestone.
 * Admin Freighter gating is client-side only for this hackathon prototype.
 */

type ApproveRequestBody = {
  milestoneId?: unknown;
};

function statusForError(
  error:
    | "invalid_milestone"
    | "already_approved"
    | "in_progress"
    | "config"
    | "stellar_submit"
    | "unknown"
): number {
  switch (error) {
    case "invalid_milestone":
      return 400;
    case "already_approved":
    case "in_progress":
      return 409;
    case "config":
      return 503;
    case "stellar_submit":
    case "unknown":
      return 502;
  }
}

export async function POST(request: Request) {
  let body: ApproveRequestBody;

  try {
    body = (await request.json()) as ApproveRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "invalid_milestone",
        message: "This milestone could not be found.",
      },
      { status: 400 }
    );
  }

  const result = await approveMilestoneOnChain(body.milestoneId);

  if (!result.success) {
    return NextResponse.json(result, {
      status: statusForError(result.error),
    });
  }

  return NextResponse.json({
    success: true,
    milestoneId: result.milestoneId,
    transactionHash: result.transactionHash,
    explorerUrl: result.explorerUrl,
    approvedBy: result.approvedBy,
    approvedAt: result.approvedAt,
  });
}
