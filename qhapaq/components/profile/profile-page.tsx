"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, Check, Copy, Loader2, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountBalances } from "@/hooks/use-account-balances";
import { useLocalizedProject } from "@/hooks/use-localized-project";
import { useWallet } from "@/hooks/use-wallet";
import { Link } from "@/i18n/navigation";
import { estimateUsdValue, huaralResort } from "@/lib/project/data";
import { stellarConfig } from "@/lib/stellar/config";
import { cn } from "@/lib/utils";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span aria-hidden className="block h-px w-8 shrink-0 bg-border sm:w-10" />
      <span className="text-[0.6875rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {children}
      </span>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <p className="text-muted-foreground">{label}</p>
      <div className="min-w-0 text-foreground">{children}</div>
    </div>
  );
}

export function ProfilePage() {
  const t = useTranslations("profile");
  const tWallet = useTranslations("wallet");
  const tParticipation = useTranslations("participation");
  const locale = useLocale();
  const project = useLocalizedProject();
  const wallet = useWallet();
  const {
    address,
    isConnected,
    isTestnet,
    isFreighterAvailable,
    isLoading,
    connect,
  } = wallet;

  const balances = useAccountBalances(
    isConnected && isTestnet ? address : null,
  );

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const networkLabel = isTestnet
    ? stellarConfig.displayName
    : tWallet("wrongNetwork");

  const connectionStatus = !isConnected
    ? t("statusDisconnected")
    : isTestnet
      ? t("statusConnected")
      : tWallet("wrongNetwork");

  let participationStatus = t("participationUnavailable");
  if (isConnected && isTestnet) {
    if (balances.isLoading) {
      participationStatus = "…";
    } else if (balances.error) {
      participationStatus = t("participationUnavailable");
    } else if (balances.hasTrustline === false) {
      participationStatus = tParticipation("noTrustline");
    } else if (Number(balances.qrpBalance ?? "0") > 0) {
      participationStatus = t("participationActive");
    } else {
      participationStatus = t("participationReady");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 sm:px-8 sm:py-16 lg:py-20">
      <header className="flex flex-col gap-6 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-10 sm:pb-12">
        <div className="max-w-xl space-y-4">
          <SectionLabel>{t("sectionProfile")}</SectionLabel>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {t.rich("heroTitle", {
              mark: (chunks) => (
                <span className="bg-primary px-1.5 py-0.5 text-primary-foreground">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
            {t("heroLead")}
          </p>
        </div>

        {isConnected ? (
          <div className="shrink-0 space-y-1 sm:text-right">
            <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t("network")}
            </p>
            <p
              className={cn(
                "text-sm font-medium",
                isTestnet ? "text-foreground" : "text-destructive",
              )}
            >
              {networkLabel}
            </p>
          </div>
        ) : null}
      </header>

      {isLoading && !isConnected ? (
        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      ) : !isConnected ? (
        <div className="mt-10 flex max-w-lg flex-col gap-5 lg:mt-14">
          <SectionLabel>{t("sectionWallet")}</SectionLabel>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("connectPrompt")}
          </p>
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
        <div className="mt-10 flex flex-col gap-14 lg:mt-14 lg:gap-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
            <section aria-labelledby="profile-wallet-heading">
              <SectionLabel>
                <span id="profile-wallet-heading">{t("sectionWallet")}</span>
              </SectionLabel>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("connectedWallet")}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {connectionStatus}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("address")}
                  </p>
                  <div className="mt-2 flex items-start gap-2">
                    <p className="min-w-0 flex-1 break-all font-mono text-[0.8125rem] leading-relaxed text-foreground">
                      {address}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        void handleCopyAddress();
                      }}
                      aria-label={
                        copied ? t("copiedAddress") : t("copyAddressAria")
                      }
                    >
                      {copied ? <Check /> : <Copy />}
                    </Button>
                  </div>
                  {copied ? (
                    <p
                      className="mt-1.5 text-xs text-foreground"
                      aria-live="polite"
                    >
                      {t("copiedAddress")}
                    </p>
                  ) : null}
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-sm text-muted-foreground">
                    {t("network")}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm font-medium",
                      isTestnet ? "text-foreground" : "text-destructive",
                    )}
                  >
                    {networkLabel}
                  </p>
                </div>
              </div>
            </section>

            <section aria-labelledby="profile-assets-heading">
              <SectionLabel>
                <span id="profile-assets-heading">{t("sectionAssets")}</span>
              </SectionLabel>

              {!isTestnet ? (
                <p className="text-sm text-destructive">
                  {tWallet("wrongNetwork")}
                </p>
              ) : balances.isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-14 w-56" />
                  <Skeleton className="h-8 w-36" />
                </div>
              ) : balances.error ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">{balances.error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit px-0"
                    onClick={() => {
                      void balances.refresh();
                    }}
                  >
                    {tParticipation("retry")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("assetQrp")}
                    </p>
                    <p className="mt-1 font-heading text-4xl font-semibold tracking-tight tabular-nums text-primary sm:text-5xl sm:tracking-tighter">
                      {balances.qrpFormatted ?? "0"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {huaralResort.token}
                    </p>
                  </div>

                  <div className="border-t border-border pt-6">
                    <p className="text-sm text-muted-foreground">
                      {t("assetXlm")}
                    </p>
                    <p className="mt-1 font-heading text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                      {balances.xlmFormatted ?? "0"}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        XLM
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <section
            aria-labelledby="profile-participation-heading"
            className="border-t border-border pt-12 lg:pt-14"
          >
            <div className="grid gap-10 lg:items-start lg:gap-16">
              <div>
                <SectionLabel>
                  <span id="profile-participation-heading">
                    {t("sectionParticipation")}
                  </span>
                </SectionLabel>

                <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {project.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {project.location}, {project.region}
                </p>

                <div className="mt-8 space-y-4">
                  <MetaRow label={t("holding")}>
                    {balances.isLoading ? (
                      <Skeleton className="h-5 w-28" />
                    ) : balances.error ? (
                      <span className="text-destructive">—</span>
                    ) : (
                      <span className="tabular-nums">
                        {balances.qrpFormatted ?? "0"} {huaralResort.token}
                        {isTestnet && !balances.error ? (
                          <span className="mt-0.5 block text-muted-foreground">
                            ≈{" "}
                            {estimateUsdValue(
                              balances.qrpBalance ?? "0",
                              huaralResort.referenceValueUsd,
                              locale,
                            )}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </MetaRow>
                  <MetaRow label={t("status")}>{participationStatus}</MetaRow>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
