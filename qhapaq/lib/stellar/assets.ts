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

export type NativeBalanceResult = {
  balance: string;
  formatted: string;
};

export type AccountBalancesResult = {
  qrp: QrpBalanceResult;
  xlm: NativeBalanceResult;
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

function toHorizonError(error: unknown, fallback: string): Error {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;

  if (status === 404) {
    return new Error(
      "This Stellar account was not found on Testnet. Fund it with Friendbot first."
    );
  }

  return new Error(error instanceof Error ? error.message : fallback);
}

/**
 * Single Horizon account load for QRP + native XLM balances.
 */
export async function fetchAccountBalances(
  publicKey: string
): Promise<AccountBalancesResult> {
  const issuer = requireQrpIssuer();
  const assetId = getQrpAssetId();
  const horizon = getHorizonServer();

  try {
    const account = await horizon.loadAccount(publicKey);

    const qrpMatch = account.balances.find(
      (balance) =>
        "asset_code" in balance &&
        balance.asset_code === QRP_ASSET_CODE &&
        balance.asset_issuer === issuer
    );

    const qrp: QrpBalanceResult =
      qrpMatch && "balance" in qrpMatch
        ? {
            balance: qrpMatch.balance,
            formatted: formatAssetBalance(qrpMatch.balance),
            hasTrustline: true,
            assetId,
          }
        : {
            balance: "0",
            formatted: formatAssetBalance("0"),
            hasTrustline: false,
            assetId,
          };

    const nativeMatch = account.balances.find(
      (balance) => balance.asset_type === "native"
    );
    const xlmBalance =
      nativeMatch && "balance" in nativeMatch ? nativeMatch.balance : "0";

    return {
      qrp,
      xlm: {
        balance: xlmBalance,
        formatted: formatAssetBalance(xlmBalance),
      },
    };
  } catch (error: unknown) {
    throw toHorizonError(
      error,
      "Failed to load account balances from Stellar Testnet."
    );
  }
}

/**
 * Fetch the real QRP classic-asset balance for an account from Horizon Testnet.
 */
export async function fetchQrpBalance(
  publicKey: string
): Promise<QrpBalanceResult> {
  const { qrp } = await fetchAccountBalances(publicKey);
  return qrp;
}
