/**
 * In-memory milestone approval ledger for the hackathon MVP (no database).
 * Survives for the lifetime of the Node process.
 * Import exclusively from server Route Handlers — never from client components.
 *
 * On-chain Stellar proofs + Pinata evidence are the durable source of truth;
 * this Map is a fast cache hydrated/reconciled by GET /api/milestones.
 */
import { INITIAL_HUARAL_MILESTONES, hasOnChainApproval } from "./data";
import { isMilestoneEvidence } from "./evidence";
import type { Milestone, MilestoneEvidence } from "./types";

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
      approvalMemo: undefined,
      evidence: undefined,
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
    approvalMemo: undefined,
    evidence: undefined,
  });
  return true;
}

export function completeMilestoneApproval(
  id: string,
  proof: {
    approvedBy: string;
    approvedAt: string;
    transactionHash: string;
    approvalMemo?: string;
    evidence: MilestoneEvidence;
  }
): Milestone | null {
  const current = milestones.get(id);
  if (!current) return null;
  if (!isMilestoneEvidence(proof.evidence)) return null;

  const approved: StoredMilestone = {
    ...current,
    status: "approved",
    approving: false,
    approvedAt: proof.approvedAt,
    approvedBy: proof.approvedBy,
    transactionHash: proof.transactionHash,
    approvalMemo: proof.approvalMemo,
    evidence: proof.evidence,
  };
  milestones.set(id, approved);
  return toPublicMilestone(approved);
}

/**
 * Idempotent apply when reconciling Horizon + Pinata after refresh.
 * Does not overwrite an existing different transaction hash.
 */
export function reconcileMilestoneApproval(
  id: string,
  proof: {
    approvedBy: string;
    approvedAt: string;
    transactionHash: string;
    approvalMemo?: string;
    evidence: MilestoneEvidence;
  }
): Milestone | null {
  const current = milestones.get(id) ?? INITIAL_HUARAL_MILESTONES.find((m) => m.id === id);
  if (!current) return null;
  if (!isMilestoneEvidence(proof.evidence)) return null;

  if (
    hasOnChainApproval(current) &&
    current.transactionHash === proof.transactionHash
  ) {
    // Refresh evidence fields if missing.
    if (!current.evidence) {
      return completeMilestoneApproval(id, proof);
    }
    return toPublicMilestone({ ...current, approving: false });
  }

  if (hasOnChainApproval(current)) {
    // Already approved with a different tx — do not create a second approval.
    return toPublicMilestone(
      milestones.get(id) ?? { ...current, approving: false }
    );
  }

  return completeMilestoneApproval(id, proof);
}

/** Roll back an in-flight approval when Pinata or Stellar submission fails. */
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
    approvalMemo: undefined,
    evidence: undefined,
  });
}

export function isMilestoneApprovalInFlight(id: string): boolean {
  return Boolean(milestones.get(id)?.approving);
}
