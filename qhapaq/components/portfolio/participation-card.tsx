"use client";

import { AlertCircle, Gift, Loader2, RefreshCw, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useLocalizedProject } from "@/hooks/use-localized-project";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { estimateUsdValue, huaralResort } from "@/lib/project/data";

type ParticipationCardProps = {
  address: string | null;
  isConnected: boolean;
  isTestnet: boolean;
  isWalletLoading?: boolean;
  isFreighterAvailable?: boolean | null;
  onConnect?: () => void;
  projectName?: string;
  onParticipate?: () => void;
};

export function ParticipationCard({
  address,
  isConnected,
  isTestnet,
  isWalletLoading = false,
  isFreighterAvailable = null,
  onConnect,
  projectName = huaralResort.name,
  onParticipate,
}: ParticipationCardProps) {
  const t = useTranslations("participation");
  const tWallet = useTranslations("wallet");
  const locale = useLocale();
  const project = useLocalizedProject();
  const { formatted, balance, hasTrustline, isLoading, error, refresh } =
    useQrpBalance(isConnected && isTestnet ? address : null);

  return (
    <div className="flex w-full flex-col gap-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-14">
        <div className="min-w-0 space-y-3">
          {isWalletLoading && !isConnected ? (
            <Skeleton className="h-24 w-56 sm:h-28" />
          ) : !isConnected ? (
            <p className="font-heading text-5xl font-semibold tracking-tight text-muted-foreground sm:text-6xl lg:text-7xl">
              —
            </p>
          ) : !isTestnet ? (
            <p className="font-heading text-5xl font-semibold tracking-tight text-destructive sm:text-6xl">
              {t("switchToTestnet")}
            </p>
          ) : isLoading ? (
            <Skeleton className="h-24 w-56 sm:h-28" />
          ) : error ? (
            <p className="font-heading text-7xl font-semibold tracking-tighter text-destructive tabular-nums sm:text-8xl">
              —
            </p>
          ) : (
            <p className="font-heading text-7xl font-semibold tracking-tighter tabular-nums sm:text-8xl lg:text-[7.5rem] lg:leading-none">
              <span className="bg-primary px-2 py-0.5 text-primary-foreground">
                {formatted ?? "0"}
              </span>
            </p>
          )}
          <p className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            {huaralResort.token}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              · {projectName}
            </span>
          </p>
          {!isConnected && !isWalletLoading ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("connectPrompt")}
            </p>
          ) : null}
          {isConnected && isTestnet && !isLoading && !error ? (
            <p className="text-base text-muted-foreground">
              ≈{" "}
              {estimateUsdValue(
                balance ?? "0",
                huaralResort.referenceValueUsd,
                locale
              )}
            </p>
          ) : null}
          {isConnected &&
          isTestnet &&
          hasTrustline === false &&
          !isLoading &&
          !error ? (
            <p className="text-sm text-muted-foreground">{t("noTrustline")}</p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:items-end lg:text-right">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t("benefits")}</p>
            <p className="flex items-center gap-2 font-medium lg:justify-end">
              <Gift className="size-4 shrink-0 text-primary" aria-hidden />
              {!isConnected && !isWalletLoading ? "—" : project.mainBenefit}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
            {!isConnected && onConnect ? (
              <Button
                className="w-full sm:w-auto"
                onClick={onConnect}
                disabled={isWalletLoading || isFreighterAvailable === false}
              >
                {isWalletLoading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Wallet data-icon="inline-start" />
                )}
                {tWallet("connect")}
              </Button>
            ) : null}
            <Link href="/benefits" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                {t("viewBenefits")}
              </Button>
            </Link>
            {onParticipate ? (
              <Button className="w-full sm:w-auto" onClick={onParticipate}>
                {t("participate")}
              </Button>
            ) : (
              <Link href="/" className="w-full sm:w-auto">
                <Button className="w-full">{t("participate")}</Button>
              </Link>
            )}
            {isConnected && isTestnet && !error ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto"
                disabled={isLoading}
                onClick={() => {
                  void refresh();
                }}
              >
                <RefreshCw data-icon="inline-start" />
                {t("refresh")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("balanceErrorTitle")}</AlertTitle>
          <AlertDescription>
            <span className="block">{error}</span>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2"
              onClick={() => {
                void refresh();
              }}
            >
              <RefreshCw data-icon="inline-start" />
              {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
