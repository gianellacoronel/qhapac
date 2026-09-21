const ID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BENEFIT_ID_PATTERN = /^QHP-[0-9A-Z]{6}$/;

function randomSegment(length: number): string {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * ID_ALPHABET.length);
    result += ID_ALPHABET[index];
  }
  return result;
}

/** Demo benefit ID, e.g. QHP-8F42A1 — not cryptographically secure. */
export function createBenefitId(): string {
  return `QHP-${randomSegment(6)}`;
}

export function normalizeBenefitId(value: string): string {
  return value.trim().toUpperCase();
}

/** True when the value matches the Qhapaq benefit ID format. */
export function isValidBenefitId(value: string): boolean {
  return BENEFIT_ID_PATTERN.test(normalizeBenefitId(value));
}

export function formatBenefitDate(iso: string, locale = "es-PE"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function buildQrPayload(benefitId: string): string {
  return JSON.stringify({
    type: "qhapaq-benefit",
    id: benefitId,
  });
}
