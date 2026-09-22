"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAccountBalances,
  type AccountBalancesResult,
} from "@/lib/stellar/assets";

export type AccountBalancesState = {
  qrpBalance: string | null;
  qrpFormatted: string | null;
  hasTrustline: boolean | null;
  assetId: string | null;
  xlmBalance: string | null;
  xlmFormatted: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to load account balances.";
}

export function useAccountBalances(address: string | null): AccountBalancesState {
  const [result, setResult] = useState<AccountBalancesResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) {
      setResult(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const next = await fetchAccountBalances(address);
      setResult(next);
    } catch (err) {
      setResult(null);
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    qrpBalance: result?.qrp.balance ?? null,
    qrpFormatted: result?.qrp.formatted ?? null,
    hasTrustline: result?.qrp.hasTrustline ?? null,
    assetId: result?.qrp.assetId ?? null,
    xlmBalance: result?.xlm.balance ?? null,
    xlmFormatted: result?.xlm.formatted ?? null,
    isLoading,
    error,
    refresh,
  };
}
