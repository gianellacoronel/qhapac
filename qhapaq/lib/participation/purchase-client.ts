/**
 * Browser-safe client for the participation purchase API.
 * Does not touch distributor secrets.
 */

export type PurchaseClientSuccess = {
  success: true;
  transactionHash: string;
  explorerUrl: string;
  amount: string;
  investorAddress: string;
};

export type PurchaseClientFailure = {
  success: false;
  error: string;
  message: string;
};

export type PurchaseClientResult = PurchaseClientSuccess | PurchaseClientFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function requestQrpPurchase(params: {
  investorAddress: string;
  amount: string;
}): Promise<PurchaseClientResult> {
  const response = await fetch("/api/participation/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      investorAddress: params.investorAddress,
      amount: params.amount,
    }),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return {
      success: false,
      error: "unknown",
      message: "Unexpected response from the purchase API.",
    };
  }

  if (
    response.ok &&
    isRecord(data) &&
    data.success === true &&
    typeof data.transactionHash === "string" &&
    typeof data.explorerUrl === "string" &&
    typeof data.amount === "string" &&
    typeof data.investorAddress === "string"
  ) {
    return {
      success: true,
      transactionHash: data.transactionHash,
      explorerUrl: data.explorerUrl,
      amount: data.amount,
      investorAddress: data.investorAddress,
    };
  }

  if (isRecord(data)) {
    return {
      success: false,
      error: typeof data.error === "string" ? data.error : "unknown",
      message:
        typeof data.message === "string" && data.message.trim()
          ? data.message
          : "We couldn't complete the QRP purchase. Please try again.",
    };
  }

  return {
    success: false,
    error: "unknown",
    message: "We couldn't complete the QRP purchase. Please try again.",
  };
}
