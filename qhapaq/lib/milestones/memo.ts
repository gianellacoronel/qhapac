/**
 * Stellar Memo.text is limited to 28 bytes.
 * Prefix keeps Qhapaq milestone approvals identifiable on explorers.
 */
export const MILESTONE_MEMO_PREFIX = "QHP-MS:";
const STELLAR_TEXT_MEMO_MAX_BYTES = 28;

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/**
 * Deterministic memo for a milestone approval proof.
 * Example: QHP-MS:construction-25
 */
export function buildMilestoneApprovalMemo(milestoneId: string): string {
  const id = milestoneId.trim();
  const full = `${MILESTONE_MEMO_PREFIX}${id}`;

  if (utf8ByteLength(full) <= STELLAR_TEXT_MEMO_MAX_BYTES) {
    return full;
  }

  const prefixLen = utf8ByteLength(MILESTONE_MEMO_PREFIX);
  const maxIdBytes = STELLAR_TEXT_MEMO_MAX_BYTES - prefixLen;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const truncatedId = decoder.decode(encoder.encode(id).slice(0, Math.max(0, maxIdBytes)));

  return `${MILESTONE_MEMO_PREFIX}${truncatedId}`;
}
