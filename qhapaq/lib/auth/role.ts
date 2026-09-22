import { StrKey } from "stellar-sdk";

export type UserRole = "admin" | "participant";

/** Public admin wallet from env — never a secret key. */
export function getAdminAddress(): string | null {
  const admin = process.env.NEXT_PUBLIC_QRP_ADMIN?.trim();
  if (!admin) return null;
  if (!StrKey.isValidEd25519PublicKey(admin)) return null;
  return admin;
}

/** Normalize Stellar G… addresses for consistent comparison. */
export function normalizeStellarAddress(address: string): string {
  return address.trim();
}

export function addressesEqual(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  return normalizeStellarAddress(a) === normalizeStellarAddress(b);
}

/**
 * Resolve app role from the connected Freighter public address.
 * Only the configured NEXT_PUBLIC_QRP_ADMIN address is admin.
 */
export function getUserRole(
  walletAddress: string | null | undefined
): UserRole {
  const admin = getAdminAddress();
  if (!walletAddress || !admin) return "participant";
  if (!StrKey.isValidEd25519PublicKey(normalizeStellarAddress(walletAddress))) {
    return "participant";
  }
  return addressesEqual(walletAddress, admin) ? "admin" : "participant";
}
