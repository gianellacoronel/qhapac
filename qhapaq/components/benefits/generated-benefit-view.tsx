"use client";

import { Check, CheckCircle2, Copy, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BenefitQr } from "@/components/benefits/benefit-qr";
import { TransactionLink } from "@/components/wallet/transaction-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { GeneratedBenefit } from "@/lib/benefits/types";
import { formatBenefitDate } from "@/lib/benefits/utils";
import { toIntlLocale } from "@/lib/project/data";
import { shortenHash } from "@/lib/stellar/explorer";

type GeneratedBenefitViewProps = {
  benefit: GeneratedBenefit;
};

export function GeneratedBenefitView({ benefit }: GeneratedBenefitViewProps) {
  if (benefit.status === "redeemed") {
    return <RedeemedBenefitView benefit={benefit} />;
  }

  return <ActiveGeneratedBenefitView benefit={benefit} />;
}

function CouponNotches({ orientation }: { orientation: "horizontal" | "vertical" }) {
  if (orientation === "horizontal") {
    return (
      <>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 -left-2.5 z-10 size-5 -translate-y-1/2 rounded-full border border-border bg-background"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 -right-2.5 z-10 size-5 -translate-y-1/2 rounded-full border border-border bg-background"
        />
      </>
    );
  }

  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-3 left-1/2 z-10 size-6 -translate-x-1/2 rounded-full border border-border bg-background"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-3 left-1/2 z-10 size-6 -translate-x-1/2 rounded-full border border-border bg-background"
      />
    </>
  );
}

function ActiveGeneratedBenefitView({ benefit }: GeneratedBenefitViewProps) {
  const t = useTranslations("benefits");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(benefit.id);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const validFor = t.has(`definitions.${benefit.benefitDefinitionId}.validFor`)
    ? t(`definitions.${benefit.benefitDefinitionId}.validFor`)
    : benefit.validFor;

  return (
    <section className="mx-auto w-full max-w-3xl">
      <article className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.55fr)_auto_minmax(0,1fr)]">
          {/* Face value */}
          <div className="flex flex-col justify-between gap-8 px-6 py-7 sm:px-8 sm:py-8">
            <div className="space-y-5">
              <p className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-sm font-medium text-primary-foreground">
                <CheckCircle2 className="size-3.5" aria-hidden />
                {t("generatedTitle")}
              </p>

              <div className="space-y-2">
                <p className="font-heading text-7xl font-semibold leading-none tracking-tighter text-primary tabular-nums sm:text-8xl">
                  {benefit.discount}
                  <span className="text-[0.5em]">%</span>
                </p>
                <p className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  {benefit.projectName}
                </p>
              </div>
            </div>

            <div className="space-y-1 border-t border-border/70 pt-5">
              <p className="text-xs text-muted-foreground">{t("validForLabel")}</p>
              <p className="text-sm font-medium leading-snug">{validFor}</p>
              <p className="pt-1 text-xs text-muted-foreground">
                {t("validForOneRedemption")}
              </p>
            </div>
          </div>

          {/* Perforation — horizontal on mobile, vertical on desktop */}
          <div
            aria-hidden
            className="relative h-0 border-t border-dashed border-border lg:hidden"
          >
            <CouponNotches orientation="horizontal" />
          </div>
          <div
            aria-hidden
            className="relative hidden w-0 border-l border-dashed border-border lg:block"
          >
            <CouponNotches orientation="vertical" />
          </div>

          {/* Stub: QR + code + verify */}
          <div className="flex flex-col items-center justify-center gap-5 bg-muted/40 px-6 py-7 sm:px-8 sm:py-8">
            <BenefitQr benefitId={benefit.id} size={148} />

            <div className="w-full max-w-[16rem] space-y-1 text-center">
              <p className="text-xs text-muted-foreground">{t("benefitId")}</p>
              <div className="flex items-center justify-center gap-1.5">
                <p className="font-mono text-lg font-semibold tracking-wider sm:text-xl">
                  {benefit.id}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    void handleCopyCode();
                  }}
                  aria-label={copied ? t("copiedCode") : t("copyCodeAria")}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
              {copied ? (
                <p className="text-xs text-foreground" aria-live="polite">
                  {t("copiedCode")}
                </p>
              ) : null}
            </div>

            <Link
              href={`/benefits/verify?id=${encodeURIComponent(benefit.id)}`}
              className="w-full max-w-[16rem]"
            >
              <Button className="w-full">
                <ShieldCheck data-icon="inline-start" />
                {t("verifyBenefit")}
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}

function RedeemedBenefitView({ benefit }: GeneratedBenefitViewProps) {
  const t = useTranslations("benefits");
  const locale = useLocale();

  return (
    <section className="mx-auto w-full max-w-3xl">
      <article className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20 text-card-foreground">
        <div className="grid lg:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)]">
          <div className="space-y-6 px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="size-4" aria-hidden />
                {t("redeemedTitle")}
              </p>
              <Badge variant="outline">{t("status.redeemed")}</Badge>
            </div>

            <div className="space-y-2">
              <p className="font-heading text-6xl font-semibold tracking-tighter text-muted-foreground tabular-nums sm:text-7xl">
                {benefit.discount}
                <span className="text-[0.55em]">%</span>
              </p>
              <p className="font-heading text-xl font-semibold tracking-tight">
                {benefit.projectName}
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">{t("benefitId")}</dt>
                <dd className="font-mono text-sm font-semibold tracking-wide">
                  {benefit.id}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">{t("redeemedOn")}</dt>
                <dd className="text-sm font-medium">
                  {benefit.redeemedAt
                    ? formatBenefitDate(benefit.redeemedAt, toIntlLocale(locale))
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div
            aria-hidden
            className="relative h-0 border-t border-dashed border-border lg:hidden"
          >
            <CouponNotches orientation="horizontal" />
          </div>
          <div
            aria-hidden
            className="relative hidden w-0 border-l border-dashed border-border lg:block"
          >
            <CouponNotches orientation="vertical" />
          </div>

          <div className="space-y-3 px-6 py-7 sm:px-8 sm:py-8">
            <p className="text-sm text-muted-foreground">{t("onChainProof")}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("proofHint")}
            </p>
            {benefit.transactionHash ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-muted-foreground">{t("transaction")}</p>
                <p className="font-mono text-sm font-semibold tracking-wide">
                  {shortenHash(benefit.transactionHash)}
                </p>
                <TransactionLink
                  hash={benefit.transactionHash}
                  label={t("viewOnExplorer")}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("txUnavailable")}</p>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
