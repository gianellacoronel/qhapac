/**
 * Stellar memo helpers for milestone approval proofs.
 *
 * Preference: Memo.hash(SHA-256 of the evidence file) — 32 bytes, exact fit.
 * Short codes like QHP-MS-01 identify the milestone in Pinata metadata and UI;
 * they are not stuffed into Memo.text alongside the hash (one memo per tx).
 */
import { HUARAL_MILESTONE_IDS, type HuaralMilestoneId } from "./data";
import { MILESTONE_SHORT_CODES } from "./evidence";

export const MILESTONE_MEMO_PREFIX = "QHP-MS-";

/** Human short code for a milestone (Pinata / UI). Not used as Memo.text. */
export function buildMilestoneApprovalMemo(milestoneId: string): string {
  const id = milestoneId.trim() as HuaralMilestoneId;
  if ((HUARAL_MILESTONE_IDS as readonly string[]).includes(id)) {
    return MILESTONE_SHORT_CODES[id];
  }
  return `${MILESTONE_MEMO_PREFIX}${id}`.slice(0, 28);
}
