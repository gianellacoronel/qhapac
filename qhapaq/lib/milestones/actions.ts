import type { Milestone, MilestoneEvidence } from "./types";
import { isMilestoneEvidence } from "./evidence";

export type MilestoneApprovalProof = {
  approvedBy: string;
  approvedAt: string;
  transactionHash: string;
  approvalMemo?: string;
  evidence: MilestoneEvidence;
};

/**
 * Apply a confirmed on-chain approval to local milestone state.
 * Only call after a successful Stellar Testnet transaction.
 */
export function applyMilestoneApproval(
  milestones: Milestone[],
  id: string,
  proof: MilestoneApprovalProof
): { milestones: Milestone[]; didApprove: boolean } {
  if (!isMilestoneEvidence(proof.evidence)) {
    return { milestones, didApprove: false };
  }

  let didApprove = false;

  const next = milestones.map((milestone) => {
    if (milestone.id !== id) {
      return milestone;
    }

    didApprove = true;
    return {
      ...milestone,
      status: "approved" as const,
      approvedAt: proof.approvedAt,
      approvedBy: proof.approvedBy,
      transactionHash: proof.transactionHash,
      approvalMemo: proof.approvalMemo,
      evidence: proof.evidence,
    };
  });

  return { milestones: next, didApprove };
}
