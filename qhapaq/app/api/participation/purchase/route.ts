import { NextResponse } from "next/server";
import {
  purchaseParticipationOnChain,
  type PurchaseParticipationFailure,
} from "@/lib/participation/purchase-api";

export const runtime = "nodejs";

type PurchaseRequestBody = {
  investorAddress?: unknown;
  amount?: unknown;
};

function statusForError(
  error: PurchaseParticipationFailure["error"]
): number {
  switch (error) {
    case "invalid_address":
    case "invalid_amount":
    case "no_trustline":
    case "account_not_found":
      return 400;
    case "insufficient_distributor":
      return 409;
    case "config":
      return 503;
    case "stellar_submit":
    case "unknown":
      return 502;
  }
}

export async function POST(request: Request) {
  let body: PurchaseRequestBody;

  try {
    body = (await request.json()) as PurchaseRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "invalid_amount",
        message: "Request body must be valid JSON.",
      } satisfies PurchaseParticipationFailure,
      { status: 400 }
    );
  }

  const result = await purchaseParticipationOnChain({
    investorAddress: body.investorAddress,
    amount: body.amount,
  });

  if (!result.success) {
    return NextResponse.json(result, {
      status: statusForError(result.error),
    });
  }

  return NextResponse.json({
    success: true,
    transactionHash: result.transactionHash,
    explorerUrl: result.explorerUrl,
    amount: result.amount,
    investorAddress: result.investorAddress,
  });
}
