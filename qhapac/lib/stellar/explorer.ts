import { stellarConfig } from "./config";

/** Build a Stellar Expert URL for a confirmed transaction hash. */
export function getTransactionExplorerUrl(hash: string): string {
  const normalized = hash.trim();
  if (!normalized) {
    throw new Error("Transaction hash is required.");
  }

  return `${stellarConfig.explorerBaseUrl}/tx/${normalized}`;
}

/** Shorten a transaction hash for compact UI display. */
export function shortenHash(hash: string, chars = 6): string {
  const normalized = hash.trim();
  if (normalized.length <= chars * 2 + 1) {
    return normalized;
  }
  return `${normalized.slice(0, chars)}…${normalized.slice(-chars)}`;
}
