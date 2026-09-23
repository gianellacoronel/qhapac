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

/**
 * Structural project data. User-facing copy is localized via messages/*.json
 * under the `project` namespace; English strings here remain as fallbacks.
 */
export const huaralResort: ProjectData = {
  id: "huaral-resort",
  name: "Huaral Resort",
  location: "Huaral",
  region: "Lima",
  token: "QRP",
  referenceValueUsd: 100,
  fundingTarget: 1000,
  fundingCurrent: 0,
  shortDescription:
    "A coastal hospitality project inviting the community to participate and unlock verifiable benefits.",
  overview: [
    "Huaral Resort brings guests a calm Pacific retreat north of Lima — pools, dining, and wellness spaces designed for long stays and local weekends.",
    "With Qhapaq you can acquire participation in this project. Your participation is measured in QRP and recorded in a verifiable way. This is not shares or an investment product.",
    "Participating unlocks a 20% discount on resort services — a concrete benefit you can generate, verify, and use.",
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
      highlight: "Verifiable record",
    },
  ],
  disclaimer:
    "This is a demonstration of verifiable participation. QRP is not a security, equity share, or investment product.",
};

export function getFundingPercent(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  if (!Number.isFinite(raised) || raised <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((raised / goal) * 100)));
}

/** Maps app locale codes to BCP 47 tags used by Intl formatters. */
export function toIntlLocale(locale?: string): string {
  if (locale === "es") return "es-PE";
  if (locale === "en") return "en-US";
  return locale || "es-PE";
}

export function formatQrp(amount: number | string, locale?: string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat(toIntlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value);
}

export function estimateUsdValue(
  qrpAmount: number | string,
  referenceValueUsd = huaralResort.referenceValueUsd,
  locale?: string
): string {
  const value = typeof qrpAmount === "string" ? Number(qrpAmount) : qrpAmount;
  if (!Number.isFinite(value)) {
    return new Intl.NumberFormat(toIntlLocale(locale), {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(0);
  }
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value * referenceValueUsd);
}
