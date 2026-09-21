const ID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

export function formatBenefitDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
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
