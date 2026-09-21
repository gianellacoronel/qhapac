import { stellarConfig } from "./config";

/** Build a Stellar Expert URL for a confirmed transaction hash. */
export function getTransactionExplorerUrl(hash: string): string {
  const normalized = hash.trim();
  if (!normalized) {
    throw new Error("Transaction hash is required.");
  }

  return `${stellarConfig.explorerBaseUrl}/tx/${normalized}`;
}
