import { huaralResort } from "@/lib/project/data";
import type { BenefitDefinition } from "@/lib/benefits/types";

export const huaralResortDiscount: BenefitDefinition = {
  id: "huaral-resort-20-off",
  projectId: huaralResort.id,
  projectName: huaralResort.name,
  title: "20% OFF",
  description: "Discount on resort services available through Qhapaq participation.",
  validFor: "Resort services",
  discount: 20,
};

export const availableBenefits: BenefitDefinition[] = [huaralResortDiscount];

export function getBenefitDefinition(
  id: string
): BenefitDefinition | undefined {
  return availableBenefits.find((benefit) => benefit.id === id);
}
