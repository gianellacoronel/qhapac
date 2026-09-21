"use client";

import { useCallback, useEffect, useState } from "react";
import type { FundingProgress } from "@/lib/stellar/funding-progress";

export type FundingProgressState = {
  raised: number | null;
  goal: number | null;
  percentage: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type FundingProgressSuccessResponse = FundingProgress & {
  success: true;
};

type FundingProgressErrorResponse = {
  success: false;
  error?: string;
  message?: string;
};

async function fetchFundingProgress(): Promise<FundingProgress> {
  const response = await fetch("/api/funding/progress", {
    method: "GET",
    cache: "no-store",
  });

  let body: FundingProgressSuccessResponse | FundingProgressErrorResponse;

  try {
    body = (await response.json()) as
      | FundingProgressSuccessResponse
      | FundingProgressErrorResponse;
  } catch {
    throw new Error("Could not load funding progress from Stellar Testnet.");
  }

  if (!response.ok || !body.success) {
    throw new Error(
      !body.success && body.message
        ? body.message
        : "Could not load funding progress from Stellar Testnet."
    );
  }

  return {
    raised: body.raised,
    goal: body.goal,
    percentage: body.percentage,
  };
}

export function useFundingProgress(): FundingProgressState {
  const [progress, setProgress] = useState<FundingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const next = await fetchFundingProgress();
      setProgress(next);
    } catch (err) {
      setProgress(null);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load funding progress from Stellar Testnet."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    raised: progress?.raised ?? null,
    goal: progress?.goal ?? null,
    percentage: progress?.percentage ?? null,
    isLoading,
    error,
    refresh,
  };
}
