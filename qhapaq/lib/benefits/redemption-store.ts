/**
 * In-memory redemption ledger for the hackathon MVP (no database).
 * Survives for the lifetime of the Node process.
 * Import exclusively from server Route Handlers — never from client components.
 */

export type StoredRedemption = {
  benefitId: string;
  status: "redeeming" | "redeemed";
  transactionHash?: string;
  explorerUrl?: string;
  redeemedAt?: string;
};

const redemptions = new Map<string, StoredRedemption>();

export function getStoredRedemption(
  benefitId: string
): StoredRedemption | undefined {
  return redemptions.get(benefitId);
}

export function beginRedemption(benefitId: string): boolean {
  const existing = redemptions.get(benefitId);
  if (existing?.status === "redeemed") {
    return false;
  }
  if (existing?.status === "redeeming") {
    return false;
  }

  redemptions.set(benefitId, {
    benefitId,
    status: "redeeming",
  });
  return true;
}

export function completeRedemption(
  benefitId: string,
  proof: { transactionHash: string; explorerUrl: string }
): StoredRedemption {
  const record: StoredRedemption = {
    benefitId,
    status: "redeemed",
    transactionHash: proof.transactionHash,
    explorerUrl: proof.explorerUrl,
    redeemedAt: new Date().toISOString(),
  };
  redemptions.set(benefitId, record);
  return record;
}

/** Roll back an in-flight redemption when Stellar submission fails. */
export function abortRedemption(benefitId: string): void {
  const existing = redemptions.get(benefitId);
  if (existing?.status === "redeeming") {
    redemptions.delete(benefitId);
  }
}
