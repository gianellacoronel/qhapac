import { Asset } from "stellar-sdk";
import { getHorizonServer, requireQrpIssuer } from "./config";

export const QRP_ASSET_CODE = "QRP";

/** Classic QRP asset already issued on Stellar Testnet. Do not recreate. */
export function getQrpAsset(): Asset {
  return new Asset(QRP_ASSET_CODE, requireQrpIssuer());
}

export function getQrpAssetId(): string {
  return `${QRP_ASSET_CODE}:${requireQrpIssuer()}`;
}

export type QrpBalanceResult = {
  balance: string;
  formatted: string;
  hasTrustline: boolean;
  assetId: string;
};

/**
 * Horizon returns classic balances as decimal strings (already scaled).
 * Normalize for display without inventing values.
 */
export function formatAssetBalance(
  balance: string,
  options?: { maxFractionDigits?: number }
): string {
  const maxFractionDigits = options?.maxFractionDigits ?? 7;
  const value = Number(balance);

  if (!Number.isFinite(value)) {
    return balance;
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/**
 * Fetch the real QRP classic-asset balance for an account from Horizon Testnet.
 */
export async function fetchQrpBalance(
  publicKey: string
): Promise<QrpBalanceResult> {
  const issuer = requireQrpIssuer();
  const assetId = getQrpAssetId();
  const horizon = getHorizonServer();

  try {
    const account = await horizon.loadAccount(publicKey);
    const match = account.balances.find(
      (balance) =>
        "asset_code" in balance &&
        balance.asset_code === QRP_ASSET_CODE &&
        balance.asset_issuer === issuer
    );

    if (!match || !("balance" in match)) {
      return {
        balance: "0",
        formatted: formatAssetBalance("0"),
        hasTrustline: false,
        assetId,
      };
    }

    return {
      balance: match.balance,
      formatted: formatAssetBalance(match.balance),
      hasTrustline: true,
      assetId,
    };
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;

    if (status === 404) {
      throw new Error(
        "This Stellar account was not found on Testnet. Fund it with Friendbot first."
      );
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to load QRP balance from Stellar Testnet."
    );
  }
}
