"use client";

import { AlertCircle, Loader2, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { useWallet } from "@/hooks/use-wallet";
import { stellarConfig } from "@/lib/stellar/config";
import { shortenAddress } from "@/lib/stellar/wallet";

export function ProfilePage() {
  const t = useTranslations("profile");
  const tWallet = useTranslations("wallet");
  const wallet = useWallet();
  const {
    address,
    isConnected,
    isTestnet,
    isFreighterAvailable,
    isLoading,
    connect,
  } = wallet;

  const balanceState = useQrpBalance(
    isConnected && isTestnet ? address : null,
  );

  const connectionStatus = !isConnected
    ? t("statusDisconnected")
    : isTestnet
      ? t("statusConnected")
      : tWallet("wrongNetwork");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 sm:px-8 sm:py-16 lg:py-20">
      <header className="max-w-xl space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {t("connectedWallet")}
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
      </header>

      {isLoading && !isConnected ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full max-w-lg" />
        </div>
      ) : !isConnected ? (
        <div className="flex max-w-lg flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("connectPrompt")}</p>
          <Button
            className="w-fit"
            onClick={() => {
              void connect().catch(() => {
                /* error surfaced via wallet.error */
              });
            }}
            disabled={isLoading || isFreighterAvailable === false}
          >
            {isLoading ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Wallet data-icon="inline-start" />
            )}
            {tWallet("connect")}
          </Button>
          {isFreighterAvailable === false ? (
            <Alert>
              <AlertCircle />
              <AlertTitle>{tWallet("freighterRequiredTitle")}</AlertTitle>
              <AlertDescription>
                {tWallet("freighterRequiredDescription")}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : (
        <dl className="grid max-w-lg gap-6 text-sm">
          <div className="space-y-1.5">
            <dt className="text-muted-foreground">{t("address")}</dt>
            <dd className="break-all font-mono text-foreground">{address}</dd>
          </div>

          <div className="space-y-1.5">
            <dt className="text-muted-foreground">{t("shortAddress")}</dt>
            <dd className="font-mono text-foreground">
              {shortenAddress(address!)}
            </dd>
          </div>

          <div className="space-y-1.5">
            <dt className="text-muted-foreground">{t("network")}</dt>
            <dd>
              <Badge variant={isTestnet ? "outline" : "destructive"}>
                {isTestnet ? stellarConfig.displayName : tWallet("wrongNetwork")}
              </Badge>
            </dd>
          </div>

          <div className="space-y-1.5">
            <dt className="text-muted-foreground">{t("connectionStatus")}</dt>
            <dd className="text-foreground">{connectionStatus}</dd>
          </div>

          <div className="space-y-1.5">
            <dt className="text-muted-foreground">{t("qrpBalance")}</dt>
            <dd className="text-foreground">
              {!isTestnet ? (
                <span className="text-muted-foreground">—</span>
              ) : balanceState.isLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : balanceState.error ? (
                <span className="text-destructive">{balanceState.error}</span>
              ) : (
                <span className="tabular-nums">
                  {balanceState.formatted ?? "0"} QRP
                </span>
              )}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
