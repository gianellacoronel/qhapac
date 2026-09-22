import { NextResponse } from "next/server";
import { listStoredMilestones } from "@/lib/milestones/approval-store";

export const runtime = "nodejs";

/** Public read of current milestone approval state (no secrets). */
export async function GET() {
  return NextResponse.json({
    milestones: listStoredMilestones(),
  });
}
