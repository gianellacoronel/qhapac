/**
 * Funding progress from Stellar Testnet (Horizon).
 * Prefer calling via the Next.js API route from the client — not on every render.
 */
import BigNumber from "bignumber.js";
import { StrKey, type Horizon } from "stellar-sdk";
import { getFundingPercent, huaralResort } from "@/lib/project/data";
import { QRP_ASSET_CODE } from "./assets";
import { getHorizonServer, requireQrpIssuer } from "./config";

export type FundingProgress = {
  raised: number;
  goal: number;
  percentage: number;
};

const PAGE_SIZE = 200;

function requireDistributorPublicKey(): string {
  const address = process.env.NEXT_PUBLIC_QRP_DISTRIBUTOR?.trim();
  if (!address) {
    throw new Error("Missing NEXT_PUBLIC_QRP_DISTRIBUTOR environment variable.");
  }
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error(
      "NEXT_PUBLIC_QRP_DISTRIBUTOR is not a valid Stellar public key."
    );
  }
  return address;
}

function isSuccessfulQrpDistributionPayment(
  record: Horizon.ServerApi.PaymentOperationRecord,
  distributor: string,
  issuer: string
): boolean {
  if (record.type !== "payment") return false;
  if (record.transaction_successful === false) return false;
  if (record.asset_type === "native") return false;
  if (record.asset_code !== QRP_ASSET_CODE) return false;
  if (record.asset_issuer !== issuer) return false;
  if (record.from !== distributor) return false;
  // Issuer→distributor mints are inbound; burns back to issuer are not sales.
  if (record.to === issuer || record.to === distributor) return false;
  return true;
}

/**
 * Sum historical QRP payments Distributor → investors on Horizon Testnet.
 * Does not use the distributor's remaining balance (that would invert progress).
 */
export async function getFundingProgress(): Promise<FundingProgress> {
  const distributor = requireDistributorPublicKey();
  const issuer = requireQrpIssuer();
  const goal = huaralResort.fundingTarget;
  const horizon = getHorizonServer();

  let raised = new BigNumber(0);
  let page = await horizon
    .payments()
    .forAccount(distributor)
    .order("asc")
    .limit(PAGE_SIZE)
    .call();

  while (page.records.length > 0) {
    for (const record of page.records) {
      if (
        !isSuccessfulQrpDistributionPayment(
          record as Horizon.ServerApi.PaymentOperationRecord,
          distributor,
          issuer
        )
      ) {
        continue;
      }

      const payment = record as Horizon.ServerApi.PaymentOperationRecord;
      raised = raised.plus(payment.amount);
    }

    if (page.records.length < PAGE_SIZE) break;

    page = await page.next();
  }

  const raisedNumber = raised.toNumber();

  return {
    raised: raisedNumber,
    goal,
    percentage: getFundingPercent(raisedNumber, goal),
  };
}
