/**
 * In-memory milestone approval ledger for the hackathon MVP (no database).
 * Survives for the lifetime of the Node process.
 * Import exclusively from server Route Handlers — never from client components.
 */
import { INITIAL_HUARAL_MILESTONES, hasOnChainApproval } from "./data";
import type { Milestone } from "./types";

type StoredMilestone = Milestone & {
  /** In-flight guard — never exposed to API responses as status. */
  approving?: boolean;
};

const milestones = new Map<string, StoredMilestone>(
  INITIAL_HUARAL_MILESTONES.map((m) => [m.id, { ...m }])
);

function toPublicMilestone(stored: StoredMilestone): Milestone {
  const { approving: _approving, ...milestone } = stored;
  // Never expose faux approved state without a Stellar proof.
  if (!hasOnChainApproval(milestone)) {
    return {
      ...milestone,
      status: "pending",
      approvedAt: undefined,
      approvedBy: undefined,
      transactionHash: undefined,
    };
  }
  return { ...milestone };
}

export function listStoredMilestones(): Milestone[] {
  return INITIAL_HUARAL_MILESTONES.map((seed) => {
    const current = milestones.get(seed.id);
    return current ? toPublicMilestone(current) : { ...seed };
  });
}

export function getStoredMilestone(id: string): Milestone | undefined {
  const current = milestones.get(id);
  return current ? toPublicMilestone(current) : undefined;
}

/**
 * Mark a milestone as approving to prevent concurrent double-submit.
 * Returns false if missing, already approved, or already in flight.
 */
export function beginMilestoneApproval(id: string): boolean {
  const current = milestones.get(id);
  if (!current) return false;
  if (hasOnChainApproval(current)) return false;
  if (current.approving) return false;

  milestones.set(id, {
    ...current,
    status: "pending",
    approving: true,
    approvedAt: undefined,
    approvedBy: undefined,
    transactionHash: undefined,
  });
  return true;
}

export function completeMilestoneApproval(
  id: string,
  proof: {
    approvedBy: string;
    approvedAt: string;
    transactionHash: string;
  }
): Milestone | null {
  const current = milestones.get(id);
  if (!current) return null;

  const approved: StoredMilestone = {
    ...current,
    status: "approved",
    approving: false,
    approvedAt: proof.approvedAt,
    approvedBy: proof.approvedBy,
    transactionHash: proof.transactionHash,
  };
  milestones.set(id, approved);
  return toPublicMilestone(approved);
}

/** Roll back an in-flight approval when Stellar submission fails. */
export function abortMilestoneApproval(id: string): void {
  const current = milestones.get(id);
  if (!current?.approving) return;

  milestones.set(id, {
    ...current,
    status: "pending",
    approving: false,
    approvedAt: undefined,
    approvedBy: undefined,
    transactionHash: undefined,
  });
}

export function isMilestoneApprovalInFlight(id: string): boolean {
  return Boolean(milestones.get(id)?.approving);
}
