/**
 * Server-only milestone approval orchestration. Import from Route Handlers only.
 *
 * AUTH LIMITATION (hackathon prototype):
 * This endpoint is not cryptographically authenticated. The Admin Wallet secret
 * signs the Stellar proof on the server, but any caller who can reach the API
 * can trigger an approval for a pending milestone. UI gating (Freighter +
 * NEXT_PUBLIC_QRP_ADMIN) is client-side only — do not treat this as server auth.
 *
 * Flow: validate → upload Pinata/IPFS → Stellar Memo.hash(SHA-256) → mark approved.
 * Never mark approved before Stellar confirms.
 */
import {
  abortMilestoneApproval,
  beginMilestoneApproval,
  completeMilestoneApproval,
  getStoredMilestone,
  isMilestoneApprovalInFlight,
  listStoredMilestones,
  reconcileMilestoneApproval,
} from "@/lib/milestones/approval-store";
import { hasOnChainApproval } from "@/lib/milestones/data";
import {
  isHuaralMilestoneId,
  sha256Hex,
  validateEvidenceDescription,
  validateEvidenceFile,
} from "@/lib/milestones/evidence";
import type { Milestone, MilestoneEvidence } from "@/lib/milestones/types";
import {
  PinataConfigError,
  buildIpfsGatewayUrl,
} from "@/lib/pinata/config";
import {
  PinataUploadError,
  listQhapaqEvidenceFromPinata,
  uploadMilestoneEvidenceToPinata,
} from "@/lib/pinata/upload-evidence";
import {
  MilestoneApprovalConfigError,
  MilestoneApprovalSubmitError,
  submitMilestoneApprovalProof,
} from "@/lib/stellar/milestone-approval";
import { listAdminEvidenceHashApprovals } from "@/lib/stellar/milestone-approvals-lookup";

export type ApproveMilestoneSuccess = {
  success: true;
  milestoneId: string;
  transactionHash: string;
  explorerUrl: string;
  approvedBy: string;
  approvedAt: string;
  evidence: MilestoneEvidence;
  approvalMemo: string;
};

export type ApproveMilestoneFailure = {
  success: false;
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
    | "unknown";
  message: string;
};

export type ApproveMilestoneResult =
  | ApproveMilestoneSuccess
  | ApproveMilestoneFailure;

/**
 * Validate + upload evidence + record approval with a real Stellar Testnet proof.
 * Status becomes approved only after a successful Stellar submit.
 */
export async function approveMilestoneOnChain(input: {
  milestoneId: unknown;
  description: unknown;
  file: File | null;
}): Promise<ApproveMilestoneResult> {
  if (
    typeof input.milestoneId !== "string" ||
    !input.milestoneId.trim() ||
    !isHuaralMilestoneId(input.milestoneId.trim())
  ) {
    return {
      success: false,
      error: "invalid_milestone",
      message: "This milestone could not be found.",
    };
  }

  const milestoneId = input.milestoneId.trim();
  const descriptionResult = validateEvidenceDescription(input.description);
  if (!descriptionResult.ok) {
    return {
      success: false,
      error: "invalid_description",
      message: "Provide a short evidence description.",
    };
  }

  const fileResult = validateEvidenceFile(input.file);
  if (!fileResult.ok) {
    if (fileResult.error === "too_large") {
      return {
        success: false,
        error: "file_too_large",
        message: "Evidence must be a PDF or image up to 10 MB.",
      };
    }
    if (fileResult.error === "invalid_type" || fileResult.error === "missing_file") {
      return {
        success: false,
        error: "invalid_file",
        message: "Attach a PDF, JPG, JPEG, PNG, or WEBP file.",
      };
    }
    return {
      success: false,
      error: "invalid_file",
      message: "Attach a PDF, JPG, JPEG, PNG, or WEBP file.",
    };
  }

  const existing = getStoredMilestone(milestoneId);

  if (!existing) {
    return {
      success: false,
      error: "invalid_milestone",
      message: "This milestone could not be found.",
    };
  }

  if (hasOnChainApproval(existing)) {
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
    if (again && hasOnChainApproval(again)) {
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
    if (!buildIpfsGatewayUrl("x")) {
      abortMilestoneApproval(milestoneId);
      return {
        success: false,
        error: "config",
        message:
          "IPFS gateway is not configured. Set NEXT_PUBLIC_GATEWAY_URL and restart.",
      };
    }

    const fileBytes = Buffer.from(await fileResult.file.arrayBuffer());
    const contentHash = sha256Hex(fileBytes);

    // Re-wrap so Pinata receives a File with a trusted MIME.
    const uploadFile = new File([fileBytes], fileResult.file.name, {
      type: fileResult.fileType,
      lastModified: fileResult.file.lastModified,
    });

    let uploaded;
    try {
      uploaded = await uploadMilestoneEvidenceToPinata({
        file: uploadFile,
        fileType: fileResult.fileType,
        milestoneId,
        description: descriptionResult.description,
        contentHash,
      });
    } catch (error: unknown) {
      abortMilestoneApproval(milestoneId);
      if (error instanceof PinataConfigError) {
        return {
          success: false,
          error: "config",
          message:
            "Pinata/IPFS is not configured on the server. Set a valid PINATA_JWT (long JWT from Pinata API Keys, not the short API key) and NEXT_PUBLIC_GATEWAY_URL, then restart.",
        };
      }
      if (error instanceof PinataUploadError) {
        return {
          success: false,
          error: "pinata_upload",
          message:
            "The evidence could not be uploaded. Please try again.",
        };
      }
      return {
        success: false,
        error: "pinata_upload",
        message:
          "The evidence could not be uploaded. Please try again.",
      };
    }

    const evidence: MilestoneEvidence = {
      description: descriptionResult.description,
      fileName: uploaded.fileName,
      fileType: uploaded.fileType,
      cid: uploaded.cid,
      gatewayUrl: uploaded.gatewayUrl,
      contentHash: uploaded.contentHash,
    };

    let proof;
    try {
      proof = await submitMilestoneApprovalProof({
        milestoneId,
        contentHash,
      });
    } catch (error: unknown) {
      // Pinata upload succeeded but Stellar failed — do NOT mark approved.
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
            "The approval could not be recorded. The milestone is still pending.",
        };
      }
      return {
        success: false,
        error: "stellar_submit",
        message:
          "The approval could not be recorded. The milestone is still pending.",
      };
    }

    const approvedAt = new Date().toISOString();
    const completed = completeMilestoneApproval(milestoneId, {
      approvedBy: proof.approvedBy,
      approvedAt,
      transactionHash: proof.hash,
      approvalMemo: proof.shortCode,
      evidence,
    });

    if (!completed) {
      // Stellar succeeded — do not submit another tx. Surface success with proof
      // so the client can recover; reconcile on next GET will also pick it up.
      return {
        success: true,
        milestoneId,
        transactionHash: proof.hash,
        explorerUrl: proof.explorerUrl,
        approvedBy: proof.approvedBy,
        approvedAt,
        evidence,
        approvalMemo: proof.shortCode,
      };
    }

    return {
      success: true,
      milestoneId,
      transactionHash: proof.hash,
      explorerUrl: proof.explorerUrl,
      approvedBy: proof.approvedBy,
      approvedAt,
      evidence,
      approvalMemo: proof.shortCode,
    };
  } catch {
    abortMilestoneApproval(milestoneId);
    return {
      success: false,
      error: "unknown",
      message:
        "The approval could not be recorded. The milestone is still pending.",
    };
  }
}

/**
 * Reconcile in-memory milestones with Pinata evidence + Horizon Memo.hash proofs.
 * Safe to call on every GET — never creates new Stellar transactions.
 */
export async function reconcileMilestonesFromSources(): Promise<Milestone[]> {
  const [pinataEvidence, onChainHits] = await Promise.all([
    listQhapaqEvidenceFromPinata(),
    listAdminEvidenceHashApprovals(80),
  ]);

  const hitsByHash = new Map(
    onChainHits.map((hit) => [hit.contentHash.toLowerCase(), hit] as const)
  );

  // Prefer newest Pinata file per milestoneId.
  const evidenceByMilestone = new Map<string, (typeof pinataEvidence)[number]>();
  for (const item of pinataEvidence) {
    const prev = evidenceByMilestone.get(item.milestoneId);
    if (!prev) {
      evidenceByMilestone.set(item.milestoneId, item);
      continue;
    }
    const prevTime = Date.parse(prev.createdAt ?? "") || 0;
    const nextTime = Date.parse(item.createdAt ?? "") || 0;
    if (nextTime >= prevTime) {
      evidenceByMilestone.set(item.milestoneId, item);
    }
  }

  for (const [milestoneId, evidenceMeta] of evidenceByMilestone) {
    const hit = hitsByHash.get(evidenceMeta.contentHash.toLowerCase());
    if (!hit) continue;

    const evidence: MilestoneEvidence = {
      description: evidenceMeta.description,
      fileName: evidenceMeta.fileName,
      fileType: evidenceMeta.fileType,
      cid: evidenceMeta.cid,
      gatewayUrl: evidenceMeta.gatewayUrl,
      contentHash: evidenceMeta.contentHash,
    };

    reconcileMilestoneApproval(milestoneId, {
      approvedBy: hit.approvedBy,
      approvedAt: hit.approvedAt,
      transactionHash: hit.transactionHash,
      approvalMemo: evidenceMeta.shortCode || undefined,
      evidence,
    });
  }

  return listStoredMilestones();
}
