"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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

function ActiveGeneratedBenefitView({ benefit }: GeneratedBenefitViewProps) {
  const t = useTranslations("benefits");

  const validFor = t.has(`definitions.${benefit.benefitDefinitionId}.validFor`)
    ? t(`definitions.${benefit.benefitDefinitionId}.validFor`)
    : benefit.validFor;

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(14rem,18rem)] lg:items-start lg:gap-14">
      <div className="min-w-0 space-y-8">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" aria-hidden />
            {t("generatedTitle")}
          </p>
          <p className="font-heading text-6xl font-semibold tracking-tighter text-primary tabular-nums sm:text-7xl lg:text-8xl">
            {benefit.discount}
            <span className="text-[0.55em]">%</span>
          </p>
          <p className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            {benefit.projectName}
          </p>
          <p className="text-sm text-muted-foreground">{validFor}</p>
        </div>

        <div className="space-y-1 border-t border-border/70 pt-6">
          <p className="text-sm text-muted-foreground">{t("benefitId")}</p>
          <p className="font-mono text-2xl font-semibold tracking-wide sm:text-3xl">
            {benefit.id}
          </p>
          <p className="pt-2 text-xs text-muted-foreground">
            {t("validForOneRedemption")}
          </p>
        </div>

        <Link
          href={`/benefits/verify?id=${encodeURIComponent(benefit.id)}`}
          className="inline-flex"
        >
          <Button>
            <ShieldCheck data-icon="inline-start" />
            {t("verifyBenefit")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center gap-4 lg:items-end">
        <BenefitQr benefitId={benefit.id} />
      </div>
    </section>
  );
}

function RedeemedBenefitView({ benefit }: GeneratedBenefitViewProps) {
  const t = useTranslations("benefits");
  const locale = useLocale();

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CheckCircle2 className="size-4" aria-hidden />
            {t("redeemedTitle")}
          </p>
          <Badge variant="outline">{t("status.redeemed")}</Badge>
        </div>
        <p className="font-heading text-6xl font-semibold tracking-tighter text-muted-foreground tabular-nums sm:text-7xl">
          {benefit.discount}
          <span className="text-[0.55em]">%</span>
        </p>
        <p className="font-heading text-xl font-semibold tracking-tight">
          {benefit.projectName}
        </p>

        <dl className="grid gap-4 border-t border-border/70 pt-6 sm:grid-cols-2">
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

      <div className="space-y-3 border-t border-border/70 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
        <p className="text-sm text-muted-foreground">{t("onChainProof")}</p>
        {benefit.transactionHash ? (
          <div className="space-y-2">
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
    </section>
  );
}
