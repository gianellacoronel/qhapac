export type MilestoneStatus = "pending" | "approved";

export type MilestoneEvidence = {
  /** Prototype mock marker — content is localized via messages. */
  mock: true;
};

export type Milestone = {
  id: string;
  status: MilestoneStatus;
  expectedDate?: string;
  approvedAt?: string;
  approvedBy?: string;
  evidence?: MilestoneEvidence;
  /** Reserved for a future real Stellar transaction. Never invent a hash. */
  transactionHash?: string;
};
