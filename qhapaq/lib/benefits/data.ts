import { huaralResort } from "@/lib/project/data";
import type { BenefitDefinition } from "@/lib/benefits/types";

export const huaralResortDiscount: BenefitDefinition = {
  id: "huaral-resort-20-off",
  projectId: huaralResort.id,
  projectName: huaralResort.name,
  title: "Resort services discount",
  description:
    "Participants receive 20% off lodging, dining, and spa services when visiting Huaral Resort.",
  validFor: "Lodging, dining, and spa",
  discount: 20,
};

export const availableBenefits: BenefitDefinition[] = [huaralResortDiscount];

export function getBenefitDefinition(
  id: string
): BenefitDefinition | undefined {
  return availableBenefits.find((benefit) => benefit.id === id);
}
