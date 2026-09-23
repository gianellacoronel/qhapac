import { NextResponse } from "next/server";
import { reconcileMilestonesFromSources } from "@/lib/milestones/approval-api";
import { listStoredMilestones } from "@/lib/milestones/approval-store";

export const runtime = "nodejs";

/**
 * Public read of milestone approval state (no secrets).
 * Reconciles Pinata evidence + Horizon Memo.hash proofs into the in-memory cache
 * so approvals survive refresh without a database.
 */
export async function GET() {
  try {
    const milestones = await reconcileMilestonesFromSources();
    return NextResponse.json({ milestones });
  } catch {
    return NextResponse.json({
      milestones: listStoredMilestones(),
    });
  }
}
