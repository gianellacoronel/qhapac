"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchQrpBalance,
  type QrpBalanceResult,
} from "@/lib/stellar/assets";

export type QrpBalanceState = {
  balance: string | null;
  formatted: string | null;
  hasTrustline: boolean | null;
  assetId: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to load QRP balance.";
}

export function useQrpBalance(address: string | null): QrpBalanceState {
  const [result, setResult] = useState<QrpBalanceResult | null>(null);
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
      const next = await fetchQrpBalance(address);
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
    balance: result?.balance ?? null,
    formatted: result?.formatted ?? null,
    hasTrustline: result?.hasTrustline ?? null,
    assetId: result?.assetId ?? null,
    isLoading,
    error,
    refresh,
  };
}
