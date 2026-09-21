export type BenefitStatus =
  | "available"
  | "generated"
  | "verified"
  | "redeeming"
  | "redeemed"
  | "failed";

export type BenefitDefinition = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  validFor: string;
  discount: number;
};

export type GeneratedBenefitStatus =
  | "generated"
  | "verified"
  | "redeeming"
  | "redeemed"
  | "failed";

export type GeneratedBenefit = {
  id: string;
  benefitDefinitionId: string;
  projectId: string;
  projectName: string;
  benefitType: string;
  validFor: string;
  discount: number;
  status: GeneratedBenefitStatus;
  generatedAt: string;
  redeemedAt?: string;
  /** Real Stellar Testnet transaction hash after successful redemption. */
  transactionHash?: string;
  /** Stellar Explorer URL for the redemption proof transaction. */
  explorerUrl?: string;
  /** Last redeem error message shown in the UI (cleared on success). */
  redeemError?: string;
};

export type Benefit = BenefitDefinition & {
  status: BenefitStatus;
};
