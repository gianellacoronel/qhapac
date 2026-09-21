export type ProjectBenefit = {
  id: string;
  title: string;
  description: string;
  highlight?: string;
};

export type ProjectData = {
  id: string;
  name: string;
  location: string;
  region: string;
  token: string;
  referenceValueUsd: number;
  fundingTarget: number;
  fundingCurrent: number;
  shortDescription: string;
  overview: string[];
  mainBenefit: string;
  benefits: ProjectBenefit[];
  disclaimer: string;
};

export const huaralResort: ProjectData = {
  id: "huaral-resort",
  name: "Huaral Resort",
  location: "Huaral",
  region: "Lima",
  token: "QRP",
  referenceValueUsd: 100,
  fundingTarget: 1000,
  fundingCurrent: 720,
  shortDescription:
    "A coastal hospitality project inviting verifiable community participation through QRP on Stellar Testnet.",
  overview: [
    "Huaral Resort brings guests a calm Pacific retreat north of Lima — pools, dining, and wellness spaces designed for long stays and local weekends.",
    "Qhapaq lets supporters participate with QRP, a classic Stellar Testnet asset that represents project participation for this hackathon prototype — not legal shares or securities.",
    "Holding QRP unlocks a 20% discount on resort services, giving participation a clear, tangible benefit.",
  ],
  mainBenefit: "20% discount on resort services",
  benefits: [
    {
      id: "discount",
      title: "Resort services discount",
      description:
        "Participants receive 20% off lodging, dining, and spa services when visiting Huaral Resort.",
      highlight: "20%",
    },
    {
      id: "priority",
      title: "Priority booking window",
      description:
        "Early access to seasonal packages and peak-weekend reservations before general release.",
      highlight: "Early access",
    },
    {
      id: "updates",
      title: "Project updates",
      description:
        "Transparent progress notes on funding, construction milestones, and guest experience improvements.",
      highlight: "On-chain linked",
    },
  ],
  disclaimer:
    "QRP on Stellar Testnet is a hackathon prototype for verifiable participation. It is not a security, equity share, or investment product.",
};

export function getFundingPercent(project: ProjectData): number {
  if (project.fundingTarget <= 0) return 0;
  return Math.min(
    100,
    Math.round((project.fundingCurrent / project.fundingTarget) * 100)
  );
}

export function formatQrp(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 7,
  }).format(value);
}

export function estimateUsdValue(
  qrpAmount: number | string,
  referenceValueUsd = huaralResort.referenceValueUsd
): string {
  const value = typeof qrpAmount === "string" ? Number(qrpAmount) : qrpAmount;
  if (!Number.isFinite(value)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value * referenceValueUsd);
}
