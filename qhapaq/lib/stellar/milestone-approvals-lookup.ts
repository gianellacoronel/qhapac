/**
 * Server-only: recover milestone approval proofs from Horizon (Admin Wallet).
 * Matches Memo.hash (SHA-256 hex) from recent admin self-payments.
 */
import { getAdminAddress } from "@/lib/auth/role";
import { getHorizonServer } from "./config";

export type OnChainApprovalHit = {
  contentHash: string;
  transactionHash: string;
  approvedAt: string;
  approvedBy: string;
};

function memoHashToHex(memo: unknown): string | null {
  if (typeof memo !== "string" || !memo.trim()) return null;

  const raw = memo.trim();

  // Horizon often returns hash memos as base64.
  try {
    const asBuf = Buffer.from(raw, "base64");
    if (asBuf.length === 32) {
      return asBuf.toString("hex");
    }
  } catch {
    // continue
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return raw.toLowerCase();
  }

  return null;
}

/**
 * Scan recent Admin Wallet transactions for Memo.hash proofs.
 * Best-effort — failures return an empty list (caller keeps memory/local cache).
 */
export async function listAdminEvidenceHashApprovals(limit = 50): Promise<
  OnChainApprovalHit[]
> {
  const admin = getAdminAddress();
  if (!admin) return [];

  try {
    const horizon = getHorizonServer();
    const page = await horizon
      .transactions()
      .forAccount(admin)
      .order("desc")
      .limit(Math.min(Math.max(limit, 1), 100))
      .call();

    const hits: OnChainApprovalHit[] = [];

    for (const tx of page.records) {
      const memoType = String(
        (tx as { memo_type?: string }).memo_type ?? ""
      ).toLowerCase();
      if (memoType !== "hash") continue;

      const contentHash = memoHashToHex((tx as { memo?: string }).memo);
      if (!contentHash) continue;

      const transactionHash = String(tx.hash ?? "").trim();
      if (!transactionHash) continue;

      const approvedAt =
        typeof tx.created_at === "string" && tx.created_at
          ? tx.created_at
          : new Date().toISOString();

      hits.push({
        contentHash,
        transactionHash,
        approvedAt,
        approvedBy: admin,
      });
    }

    return hits;
  } catch {
    return [];
  }
}
