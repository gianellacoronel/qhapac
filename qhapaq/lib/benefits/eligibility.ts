/**
 * Resort services discount may be generated only by:
 * - the configured admin wallet, or
 * - a participant with at least 1 QRP in their account.
 */
export function canGenerateResortServiceDiscount(params: {
  isAdmin: boolean;
  qrpBalance: string | number | null | undefined;
}): boolean {
  if (params.isAdmin) return true;

  const amount = Number(params.qrpBalance ?? 0);
  return Number.isFinite(amount) && amount >= 1;
}
