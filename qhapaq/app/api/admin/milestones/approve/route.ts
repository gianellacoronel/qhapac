import { NextResponse } from "next/server";
import { approveMilestoneOnChain } from "@/lib/milestones/approval-api";

export const runtime = "nodejs";

/**
 * POST /api/admin/milestones/approve
 *
 * multipart/form-data:
 *  - milestoneId
 *  - description
 *  - file (PDF / JPG / JPEG / PNG / WEBP, ≤ 10 MB)
 *
 * AUTH LIMITATION: No cryptographic admin session. Anyone who can call this
 * route may trigger a server-signed Admin Wallet proof for a pending milestone.
 * Admin Freighter gating is client-side only for this hackathon prototype.
 *
 * Never returns secrets (PINATA_JWT, QHAPAQ_ADMIN_SECRET_KEY, etc.).
 */

function statusForError(
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
    | "unknown"
): number {
  switch (error) {
    case "invalid_milestone":
    case "invalid_description":
    case "invalid_file":
    case "file_too_large":
      return 400;
    case "already_approved":
    case "in_progress":
      return 409;
    case "config":
      return 503;
    case "pinata_upload":
    case "stellar_submit":
    case "unknown":
      return 502;
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "invalid_file",
        message: "Attach a PDF, JPG, JPEG, PNG, or WEBP file.",
      },
      { status: 400 }
    );
  }

  const milestoneId = form.get("milestoneId");
  const description = form.get("description");
  const fileEntry = form.get("file");
  const file =
    fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

  const result = await approveMilestoneOnChain({
    milestoneId,
    description,
    file,
  });

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
    approvalMemo: result.approvalMemo,
    evidence: result.evidence,
  });
}
