"use client";

import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionLink } from "@/components/wallet/transaction-link";
import { useTestTransaction } from "@/hooks/use-test-transaction";
import { shortenHash } from "@/lib/stellar/explorer";
import { TEST_XLM_AMOUNT } from "@/lib/stellar/transactions";

type TestTransactionCardProps = {
  address: string | null;
  isConnected: boolean;
  isTestnet: boolean;
};

function statusBadgeLabel(
  status: ReturnType<typeof useTestTransaction>["status"]
): string | null {
  switch (status) {
    case "signing":
      return "Awaiting approval";
    case "submitting":
      return "Submitting";
    case "success":
      return "Confirmed";
    case "error":
      return "Failed";
    default:
      return null;
  }
}

export function TestTransactionCard({
  address,
  isConnected,
  isTestnet,
}: TestTransactionCardProps) {
  const { status, hash, error, isPending, run, reset } =
    useTestTransaction(isConnected && isTestnet ? address : null);

  const canRun = isConnected && isTestnet && !isPending;
  const badgeLabel = statusBadgeLabel(status);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>Smoke test</CardDescription>
            <CardTitle className="font-heading text-xl">
              Stellar transaction
            </CardTitle>
          </div>
          {badgeLabel ? (
            <Badge
              variant={
                status === "success"
                  ? "secondary"
                  : status === "error"
                    ? "destructive"
                    : "outline"
              }
            >
              {badgeLabel}
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sends {TEST_XLM_AMOUNT} XLM to your own account on Testnet. Uses
          Freighter for signing — no private keys, no QRP movement.
        </p>

        {!isConnected ? (
          <p className="text-sm text-muted-foreground">
            Connect Freighter to run a test transaction.
          </p>
        ) : !isTestnet ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Wrong network</AlertTitle>
            <AlertDescription>
              Switch Freighter to Stellar Testnet before sending.
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "signing" || status === "submitting" ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <p className="text-sm text-muted-foreground">
              {status === "signing"
                ? "Waiting for wallet approval..."
                : "Submitting transaction..."}
            </p>
          </div>
        ) : null}

        {status === "success" && hash ? (
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Transaction confirmed</AlertTitle>
            <AlertDescription>
              <span className="mt-1 block font-mono text-xs break-all">
                {shortenHash(hash)}
              </span>
              <span className="mt-1 block font-mono text-[11px] break-all text-muted-foreground">
                {hash}
              </span>
              <span className="mt-3 block">
                <TransactionLink hash={hash} />
              </span>
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "error" && error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Transaction failed</AlertTitle>
            <AlertDescription>
              <span className="block">{error}</span>
              <Button
                variant="ghost"
                size="xs"
                className="mt-2"
                onClick={reset}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          disabled={!canRun}
          onClick={() => {
            void run();
          }}
        >
          {isPending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Send data-icon="inline-start" />
          )}
          {status === "signing"
            ? "Waiting for wallet approval..."
            : status === "submitting"
              ? "Submitting transaction..."
              : "Test Stellar Transaction"}
        </Button>
      </CardContent>
    </Card>
  );
}
