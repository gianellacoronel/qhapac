import type { Milestone } from "./types";

export type MilestoneApprovalProof = {
  approvedBy: string;
  approvedAt: string;
  transactionHash: string;
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
    };
  });

  return { milestones: next, didApprove };
}
