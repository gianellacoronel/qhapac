export type BenefitStatus = "available" | "generated" | "redeemed";

export type BenefitDefinition = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  validFor: string;
  discount: number;
};

export type GeneratedBenefit = {
  id: string;
  benefitDefinitionId: string;
  projectId: string;
  projectName: string;
  benefitType: string;
  validFor: string;
  discount: number;
  status: "generated" | "redeemed";
  generatedAt: string;
  redeemedAt?: string;
};

export type Benefit = BenefitDefinition & {
  status: BenefitStatus;
};
