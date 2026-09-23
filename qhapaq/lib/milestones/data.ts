import type { Milestone } from "./types";

/**
 * Demo milestone seed for Huaral Resort (hackathon MVP).
 * Not live project data — used to demonstrate admin / participant flows.
 * Qhapaq records associated approvals and evidence; it does not verify
 * that physical construction occurred.
 *
 * All start pending: an "approved" status requires a real Stellar proof
 * (see hasOnChainApproval). Do not invent transaction hashes for demos.
 */
export const HUARAL_MILESTONE_IDS = [
  "land-acquisition",
  "construction-start",
  "construction-25",
  "construction-50",
  "project-complete",
] as const;

export type HuaralMilestoneId = (typeof HUARAL_MILESTONE_IDS)[number];

export const INITIAL_HUARAL_MILESTONES: Milestone[] = [
  {
    id: "land-acquisition",
    status: "pending",
    expectedDate: "2026-09-24",
  },
  {
    id: "construction-start",
    status: "pending",
    expectedDate: "2026-09-30",
  },
  {
    id: "construction-25",
    status: "pending",
    expectedDate: "2026-11-30",
  },
  {
    id: "construction-50",
    status: "pending",
    expectedDate: "2027-01-31",
  },
  {
    id: "project-complete",
    status: "pending",
    expectedDate: "2027-06-30",
  },
];

/** Approved only when status is approved and a Stellar proof hash exists. */
export function hasOnChainApproval(milestone: Milestone): boolean {
  return (
    milestone.status === "approved" &&
    typeof milestone.transactionHash === "string" &&
    milestone.transactionHash.trim().length > 0
  );
}

export function countApprovedMilestones(milestones: Milestone[]): number {
  return milestones.filter((m) => hasOnChainApproval(m)).length;
}

export function countPendingMilestones(milestones: Milestone[]): number {
  return milestones.filter((m) => !hasOnChainApproval(m)).length;
}
