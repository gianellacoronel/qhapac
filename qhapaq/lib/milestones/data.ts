import type { Milestone } from "./types";

/**
 * Demo milestone seed for Huaral Resort (hackathon MVP).
 * Not live project data — used to demonstrate admin / participant flows.
 * Qhapaq records associated approvals and evidence; it does not verify
 * that physical construction occurred.
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
    status: "approved",
    expectedDate: "2026-08-15",
    approvedAt: "2026-08-15T15:00:00.000Z",
    approvedBy: "prototype",
    evidence: { mock: true },
  },
  {
    id: "construction-start",
    status: "pending",
    expectedDate: "2026-09-30",
    evidence: { mock: true },
  },
  {
    id: "construction-25",
    status: "pending",
    expectedDate: "2026-11-30",
    evidence: { mock: true },
  },
  {
    id: "construction-50",
    status: "pending",
    expectedDate: "2027-01-31",
    evidence: { mock: true },
  },
  {
    id: "project-complete",
    status: "pending",
    expectedDate: "2027-06-30",
    evidence: { mock: true },
  },
];

export function countApprovedMilestones(milestones: Milestone[]): number {
  return milestones.filter((m) => m.status === "approved").length;
}

export function countPendingMilestones(milestones: Milestone[]): number {
  return milestones.filter((m) => m.status === "pending").length;
}
