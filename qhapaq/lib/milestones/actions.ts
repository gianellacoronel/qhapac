import type { Milestone } from "./types";

/**
 * Local/prototype approval. Later this can be replaced by a Stellar
 * transaction flow that also sets `transactionHash`.
 */
export function approveMilestone(
  milestones: Milestone[],
  id: string,
  approvedBy: string
): { milestones: Milestone[]; didApprove: boolean } {
  let didApprove = false;

  const next = milestones.map((milestone) => {
    if (milestone.id !== id || milestone.status === "approved") {
      return milestone;
    }

    didApprove = true;
    return {
      ...milestone,
      status: "approved" as const,
      approvedAt: new Date().toISOString(),
      approvedBy,
      // Intentionally omit transactionHash until a real Stellar tx exists.
    };
  });

  return { milestones: next, didApprove };
}
