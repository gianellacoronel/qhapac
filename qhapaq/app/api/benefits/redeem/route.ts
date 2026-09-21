import { NextResponse } from "next/server";
import { redeemBenefitOnChain } from "@/lib/benefits/redemption-api";

export const runtime = "nodejs";

type RedeemRequestBody = {
  benefitId?: unknown;
};

function statusForError(
  error: "invalid_benefit" | "already_redeemed" | "config" | "stellar_submit" | "unknown"
): number {
  switch (error) {
    case "invalid_benefit":
      return 400;
    case "already_redeemed":
      return 409;
    case "config":
      return 503;
    case "stellar_submit":
    case "unknown":
      return 502;
  }
}

export async function POST(request: Request) {
  let body: RedeemRequestBody;

  try {
    body = (await request.json()) as RedeemRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "invalid_benefit",
        message: "This benefit could not be verified.",
      },
      { status: 400 }
    );
  }

  const result = await redeemBenefitOnChain(body.benefitId);

  if (!result.success) {
    return NextResponse.json(result, {
      status: statusForError(result.error),
    });
  }

  return NextResponse.json({
    success: true,
    benefitId: result.benefitId,
    transactionHash: result.transactionHash,
    explorerUrl: result.explorerUrl,
  });
}
