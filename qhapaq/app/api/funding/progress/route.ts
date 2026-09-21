import { NextResponse } from "next/server";
import { getFundingProgress } from "@/lib/stellar/funding-progress";

export const runtime = "nodejs";

export async function GET() {
  try {
    const progress = await getFundingProgress();
    return NextResponse.json({
      success: true as const,
      ...progress,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not load funding progress from Stellar Testnet.";

    return NextResponse.json(
      {
        success: false as const,
        error: "stellar_unavailable",
        message,
      },
      { status: 502 }
    );
  }
}
