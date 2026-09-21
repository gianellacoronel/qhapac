"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { BenefitQr } from "@/components/benefits/benefit-qr";
import { TransactionLink } from "@/components/wallet/transaction-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <Card className="w-full max-w-md shadow-xs">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 className="size-4" aria-hidden />
          {t("generatedTitle")}
        </div>
        <div className="space-y-1">
          <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
            {t("percentOff", { discount: benefit.discount })}
          </CardTitle>
          <CardDescription className="text-base text-foreground">
            {benefit.projectName}
          </CardDescription>
          <p className="text-sm text-muted-foreground">{validFor}</p>
        </div>
      </CardHeader>

      <CardContent className="gap-5">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            {t("benefitId")}
          </p>
          <p className="font-mono text-lg font-semibold tracking-wide">
            {benefit.id}
          </p>
        </div>

        <div className="flex justify-center">
          <BenefitQr benefitId={benefit.id} />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {t("validForOneRedemption")}
        </p>
      </CardContent>

      <CardFooter>
        <Link
          href={`/benefits/verify?id=${encodeURIComponent(benefit.id)}`}
          className="w-full"
        >
          <Button className="w-full">
            <ShieldCheck data-icon="inline-start" />
            {t("verifyBenefit")}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function RedeemedBenefitView({ benefit }: GeneratedBenefitViewProps) {
  const t = useTranslations("benefits");
  const locale = useLocale();

  return (
    <Card className="w-full max-w-md shadow-xs">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" aria-hidden />
            {t("redeemedTitle")}
          </div>
          <Badge variant="outline">{t("status.redeemed")}</Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
            {t("percentOff", { discount: benefit.discount })}
          </CardTitle>
          <CardDescription className="text-base text-foreground">
            {benefit.projectName}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              {t("benefitId")}
            </p>
            <p className="font-mono text-sm font-semibold tracking-wide">
              {benefit.id}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              {t("statusLabel")}
            </p>
            <p className="text-sm font-medium">{t("status.redeemed")}</p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              {t("redeemedOn")}
            </p>
            <p className="text-sm font-medium">
              {benefit.redeemedAt
                ? formatBenefitDate(benefit.redeemedAt, toIntlLocale(locale))
                : "—"}
            </p>
          </div>
        </div>

        <Separator />

        {benefit.transactionHash ? (
          <div className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              {t("onChainProof")}
            </p>
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {t("transaction")}
              </p>
              <p className="font-mono text-sm font-semibold tracking-wide">
                {shortenHash(benefit.transactionHash)}
              </p>
            </div>
            <TransactionLink
              hash={benefit.transactionHash}
              label={t("viewOnExplorer")}
            />
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              {t("onChainProof")}
            </p>
            <p className="text-sm text-muted-foreground">{t("txUnavailable")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
