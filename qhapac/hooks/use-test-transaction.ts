"use client";

import { useCallback, useState } from "react";
import {
  sendTestXlmPayment,
  type SubmitResult,
  type TransactionPhase,
} from "@/lib/stellar/transactions";

export type TestTransactionStatus =
  | "idle"
  | "signing"
  | "submitting"
  | "success"
  | "error";

export type TestTransactionState = {
  status: TestTransactionStatus;
  hash: string | null;
  ledger: number | null;
  error: string | null;
  isPending: boolean;
  run: () => Promise<void>;
  reset: () => void;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Transaction failed. Please try again.";
}

function phaseToStatus(phase: TransactionPhase): TestTransactionStatus {
  switch (phase) {
    case "building":
    case "signing":
      return "signing";
    case "submitting":
      return "submitting";
  }
}

export function useTestTransaction(
  address: string | null
): TestTransactionState {
  const [status, setStatus] = useState<TestTransactionStatus>("idle");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const run = useCallback(async () => {
    if (!address) {
      setStatus("error");
      setError("Connect your Freighter wallet before sending a transaction.");
      setResult(null);
      return;
    }

    setStatus("signing");
    setError(null);
    setResult(null);

    try {
      const next = await sendTestXlmPayment(address, {
        onPhaseChange: (phase) => {
          setStatus(phaseToStatus(phase));
        },
      });
      setResult(next);
      setStatus("success");
    } catch (err) {
      setResult(null);
      setError(toErrorMessage(err));
      setStatus("error");
    }
  }, [address]);

  return {
    status,
    hash: result?.hash ?? null,
    ledger: result?.ledger ?? null,
    error,
    isPending: status === "signing" || status === "submitting",
    run,
    reset,
  };
}
