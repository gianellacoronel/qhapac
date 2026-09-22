"use client";

import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function TestTransactionCard({
  address,
  isConnected,
  isTestnet,
}: TestTransactionCardProps) {
  const t = useTranslations("transaction");
  const { status, hash, error, isPending, run, reset } =
    useTestTransaction(isConnected && isTestnet ? address : null);

  const canRun = isConnected && isTestnet && !isPending;

  const badgeLabel =
    status === "signing" ||
    status === "submitting" ||
    status === "success" ||
    status === "error"
      ? t(`status.${status}`)
      : null;

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-10">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {t("title")}
          </h2>
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
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("description", { amount: TEST_XLM_AMOUNT })}
        </p>

        {!isConnected ? (
          <p className="text-sm text-muted-foreground">{t("connectPrompt")}</p>
        ) : !isTestnet ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{t("wrongNetworkTitle")}</AlertTitle>
            <AlertDescription>{t("wrongNetworkDescription")}</AlertDescription>
          </Alert>
        ) : null}

        {status === "signing" || status === "submitting" ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <p className="text-sm text-muted-foreground">
              {status === "signing" ? t("waitingApproval") : t("submitting")}
            </p>
          </div>
        ) : null}

        {status === "success" && hash ? (
          <Alert>
            <CheckCircle2 />
            <AlertTitle>{t("confirmedTitle")}</AlertTitle>
            <AlertDescription>
              <span className="mt-1 block font-mono text-xs break-all">
                {shortenHash(hash)}
              </span>
              <span className="mt-3 block">
                <TransactionLink hash={hash} label={t("viewOnExplorer")} />
              </span>
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "error" && error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{t("failedTitle")}</AlertTitle>
            <AlertDescription>
              <span className="block">{error}</span>
              <Button
                variant="ghost"
                size="xs"
                className="mt-2"
                onClick={reset}
              >
                {t("dismiss")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <Button
        variant="outline"
        disabled={!canRun}
        className="w-full sm:w-auto"
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
          ? t("waitingApproval")
          : status === "submitting"
            ? t("submitting")
            : t("testButton")}
      </Button>
    </div>
  );
}
