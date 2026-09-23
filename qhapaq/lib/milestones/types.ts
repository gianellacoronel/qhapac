export type MilestoneStatus = "pending" | "approved";

/** Real IPFS evidence attached during Admin approval. */
export type MilestoneEvidence = {
  description: string;
  fileName: string;
  fileType: string;
  cid: string;
  gatewayUrl: string;
  /** SHA-256 hex of the evidence file bytes. */
  contentHash: string;
};

export type Milestone = {
  id: string;
  status: MilestoneStatus;
  expectedDate?: string;
  approvedAt?: string;
  approvedBy?: string;
  evidence?: MilestoneEvidence;
  /** Real Stellar transaction hash. Never invent a hash. */
  transactionHash?: string;
  /** Short milestone ref recorded alongside the approval (e.g. QHP-MS-01). */
  approvalMemo?: string;
};
