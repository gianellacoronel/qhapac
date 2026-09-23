"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useBenefitSession } from "@/components/benefits/benefit-session";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionLink } from "@/components/wallet/transaction-link";
import { QrpLabel } from "@/components/qrp-help";
import { StellarNetworkLabel } from "@/components/stellar-help";
import { useAccountBalances } from "@/hooks/use-account-balances";
import { useLocalizedProject } from "@/hooks/use-localized-project";
import { useWallet } from "@/hooks/use-wallet";
import { Link } from "@/i18n/navigation";
import { availableBenefits } from "@/lib/benefits/data";
import { formatBenefitDate } from "@/lib/benefits/utils";
import {
  estimateUsdValue,
  huaralResort,
  toIntlLocale,
} from "@/lib/project/data";
import { shortenAddress } from "@/lib/stellar/wallet";
import { cn } from "@/lib/utils";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="text-[0.6875rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {children}
      </span>
    </div>
  );
}

function HighlightStat({
  value,
  label,
  emphasize = false,
  loading = false,
}: {
  value: ReactNode;
  label: string;
  emphasize?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      {loading ? (
        <Skeleton className="h-10 w-28" />
      ) : (
        <p
          className={cn(
            "font-heading font-semibold tracking-tight",
            emphasize
              ? "text-3xl text-primary tabular-nums sm:text-4xl sm:tracking-tighter"
              : "text-2xl text-foreground sm:text-3xl",
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}

export function ProfilePage() {
  const t = useTranslations("profile");
  const tWallet = useTranslations("wallet");
  const tParticipation = useTranslations("participation");
  const tBenefits = useTranslations("benefits");
  const locale = useLocale();
  const project = useLocalizedProject();
  const wallet = useWallet();
  const { generatedBenefit } = useBenefitSession();
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
  const primaryBenefit = availableBenefits[0];
  const qrpIssuer = process.env.NEXT_PUBLIC_QRP_ISSUER?.trim() || null;
  const qrpAmount = Number(balances.qrpBalance ?? "0");
  const hasQrp = Number.isFinite(qrpAmount) && qrpAmount > 0;
  const balancesReady =
    isConnected && isTestnet && !balances.isLoading && !balances.error;

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

  const networkLabel = isTestnet ? (
    <StellarNetworkLabel brief={false} />
  ) : (
    tWallet("wrongNetwork")
  );

  let participationStatus = t("participationUnavailable");
  let participationBody = t("participationIntroUnavailable");
  if (isConnected && isTestnet) {
    if (balances.isLoading) {
      participationStatus = "…";
      participationBody = "…";
    } else if (balances.error) {
      participationStatus = t("participationUnavailable");
      participationBody = t("participationIntroUnavailable");
    } else if (balances.hasTrustline === false) {
      participationStatus = t("participationNeedsSetup");
      participationBody = t("participationIntroNoTrustline", {
        project: project.name,
      });
    } else if (hasQrp) {
      participationStatus = t("participationActive");
      participationBody = t("participationIntroActive", {
        project: project.name,
      });
    } else {
      participationStatus = t("participationReady");
      participationBody = t("participationIntroReady", {
        project: project.name,
      });
    }
  }

  const redeemedProof =
    generatedBenefit?.status === "redeemed" && generatedBenefit.transactionHash
      ? generatedBenefit
      : null;

  const activeGenerated =
    generatedBenefit &&
    generatedBenefit.status !== "redeemed" &&
    generatedBenefit.status !== "failed"
      ? generatedBenefit
      : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 sm:px-8 sm:py-16 lg:py-14">
      <header className="pb-10 sm:pb-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-14">
          <div className="max-w-xl space-y-4">
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

          {isLoading && !isConnected ? (
            <div className="space-y-3 lg:justify-self-end lg:text-right">
              <Skeleton className="h-3 w-20 lg:ml-auto" />
              <Skeleton className="h-5 w-48 lg:ml-auto" />
            </div>
          ) : isConnected && address ? (
            <div className="min-w-0 space-y-2 lg:justify-self-end lg:text-right">
              <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {t("yourWallet")}
              </p>
              <div className="flex items-start gap-2 lg:justify-end">
                <p className="min-w-0 break-all font-mono text-[0.8125rem] leading-relaxed text-foreground">
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
                <p className="text-xs text-foreground" aria-live="polite">
                  {t("copiedAddress")}
                </p>
              ) : null}
              {!isTestnet ? (
                <p className="text-sm font-medium text-destructive">
                  {networkLabel}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {isLoading && !isConnected ? (
        <div className="mt-10 flex max-w-lg flex-col gap-4 lg:mt-14" aria-busy>
          <SectionLabel>{t("yourWallet")}</SectionLabel>
          <p className="text-sm text-muted-foreground">{t("loadingProfile")}</p>
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : !isConnected ? (
        <div className="mt-10 flex max-w-lg flex-col gap-5 lg:mt-14">
          <SectionLabel>{t("yourWallet")}</SectionLabel>
          <div className="space-y-2">
            <p className="text-base leading-relaxed text-foreground sm:text-[1.0625rem]">
              {t("connectPrompt")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("connectPromptDetail")}
            </p>
          </div>
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
          {!isTestnet ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>{tWallet("wrongNetwork")}</AlertTitle>
              <AlertDescription>
                {tWallet.rich("wrongNetworkMessage", {
                  network: () => <StellarNetworkLabel />,
                })}
              </AlertDescription>
            </Alert>
          ) : null}

          {isTestnet ? (
            <section aria-label={t("highlightsAria")} className="py-2 sm:py-4">
              {balances.error ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="grid gap-8 sm:grid-cols-3 sm:gap-10">
                  <HighlightStat
                    label={t("metricParticipation")}
                    emphasize
                    loading={balances.isLoading}
                    value={
                      <>
                        {balances.qrpFormatted ?? "0"}
                        <QrpLabel
                          brief={false}
                          className="ml-2 text-[0.45em] font-medium tracking-normal text-muted-foreground"
                          helpClassName="size-3 text-[0.55rem]"
                        />
                      </>
                    }
                  />
                  <HighlightStat
                    label={t("metricBenefit")}
                    emphasize
                    value={
                      <>
                        {primaryBenefit?.discount ?? 20}
                        <span className="text-[0.55em]">%</span>
                      </>
                    }
                  />
                  <HighlightStat
                    label={t("metricProject")}
                    value={project.name}
                  />
                </div>
              )}
            </section>
          ) : null}

          {isTestnet ? (
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
              <section aria-labelledby="profile-participation-heading">
                <SectionLabel>
                  <span id="profile-participation-heading">
                    {t("sectionParticipation")}
                  </span>
                </SectionLabel>

                <div className="space-y-5">
                  <div className="space-y-2">
                    {balances.isLoading ? (
                      <Skeleton className="h-5 w-72" />
                    ) : (
                      <p className="text-base leading-relaxed text-foreground sm:text-[1.0625rem]">
                        {participationBody}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {t("status")}:{" "}
                      <span className="text-foreground">
                        {participationStatus}
                      </span>
                    </p>
                  </div>

                  <p className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
                    <span>{t("tokenLabel")}</span>
                    <QrpLabel
                      brief
                      showHelp={false}
                      className="text-xs text-muted-foreground"
                    />
                  </p>

                  {balancesReady && hasQrp ? (
                    <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                      {t("referenceNote", {
                        value: estimateUsdValue(
                          balances.qrpBalance ?? "0",
                          huaralResort.referenceValueUsd,
                          locale,
                        ),
                      })}
                    </p>
                  ) : null}

                  {!balances.isLoading &&
                  !balances.error &&
                  (balances.hasTrustline === false || !hasQrp) ? (
                    <Link href="/" className="inline-flex w-fit ml-2">
                      <Button variant="outline" size="sm">
                        {t("participate")}
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </section>

              <section aria-labelledby="profile-benefits-heading">
                <SectionLabel>
                  <span id="profile-benefits-heading">
                    {t("sectionBenefits")}
                  </span>
                </SectionLabel>

                <div className="space-y-5">
                  <div>
                    <p className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      {t("benefitDiscount", {
                        discount: primaryBenefit?.discount ?? 20,
                      })}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t("benefitAvailableFor")}
                    </p>
                  </div>

                  {activeGenerated ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        {t("benefitActive")}
                      </p>
                      <p className="font-mono text-sm text-foreground">
                        {activeGenerated.id}
                      </p>
                      <Link href="/benefits" className="inline-flex w-fit">
                        <Button variant="outline" size="sm">
                          {t("viewBenefit")}
                        </Button>
                      </Link>
                    </div>
                  ) : redeemedProof ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t("benefitUsedHint")}
                      </p>
                      <Link href="/benefits" className="inline-flex w-fit">
                        <Button variant="outline" size="sm">
                          {t("goToBenefits")}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {hasQrp
                          ? t("howToGetBenefits")
                          : t("howToGetBenefitsNoParticipation")}
                      </p>
                      <Link href="/benefits" className="inline-flex w-fit">
                        <Button variant="outline" size="sm">
                          {t("goToBenefits")}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {isTestnet ? (
            <section aria-labelledby="profile-activity-heading">
              <SectionLabel>
                <span id="profile-activity-heading">
                  {t("sectionActivity")}
                </span>
              </SectionLabel>

              {redeemedProof ? (
                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-10">
                  <div className="min-w-0 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {t("activityBenefitUsed")}
                    </p>
                    <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                      {tBenefits("discountLabel", {
                        discount: redeemedProof.discount,
                      })}
                    </p>
                    {redeemedProof.redeemedAt ? (
                      <p className="text-sm text-muted-foreground">
                        {formatBenefitDate(
                          redeemedProof.redeemedAt,
                          toIntlLocale(locale),
                        )}
                      </p>
                    ) : null}
                  </div>
                  <TransactionLink
                    hash={redeemedProof.transactionHash!}
                    label={t("activityViewProof")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  />
                </div>
              ) : (
                <div className="flex max-w-xl flex-col gap-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("activityEmpty")}
                  </p>
                  <Link
                    href="/benefits/verify"
                    className="inline-flex w-fit items-center text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {t("verifyInfo")}
                  </Link>
                </div>
              )}
            </section>
          ) : null}

          <details className="group border-t border-border/60 pt-10 lg:pt-12">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <span className="text-[0.6875rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                {t("sectionTechnical")}
              </span>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>

            <div className="mt-6 grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="text-muted-foreground">{t("network")}</p>
                <p
                  className={cn(
                    "font-medium",
                    isTestnet ? "text-foreground" : "text-destructive",
                  )}
                >
                  {networkLabel}
                </p>
              </div>

              {qrpIssuer ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("qrpIssuer")}</p>
                  <p className="font-mono text-[0.8125rem] text-foreground">
                    {shortenAddress(qrpIssuer, 6)}
                  </p>
                </div>
              ) : null}

              {isTestnet && balancesReady ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("assetXlm")}</p>
                  <p className="tabular-nums text-foreground">
                    {balances.xlmFormatted ?? "0"} XLM
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("xlmHint")}
                  </p>
                </div>
              ) : null}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
