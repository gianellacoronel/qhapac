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
    <Card className="w-full gap-0 py-0 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-(--card-spacing) py-(--card-spacing)">
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

            <p className="text-xs text-muted-foreground lg:hidden">
              {t("validForOneRedemption")}
            </p>
          </CardContent>

          <CardFooter className="mt-auto hidden lg:flex">
            <Link
              href={`/benefits/verify?id=${encodeURIComponent(benefit.id)}`}
              className="w-full sm:w-auto"
            >
              <Button>
                <ShieldCheck data-icon="inline-start" />
                {t("verifyBenefit")}
              </Button>
            </Link>
          </CardFooter>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 border-t border-border/60 px-(--card-spacing) py-(--card-spacing) lg:w-72 lg:shrink-0 lg:border-t-0 lg:border-l lg:border-border/60">
          <BenefitQr benefitId={benefit.id} />
          <p className="hidden text-center text-xs text-muted-foreground lg:block">
            {t("validForOneRedemption")}
          </p>
        </div>

        <CardFooter className="border-t border-border/60 py-(--card-spacing) lg:hidden">
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
      </div>
    </Card>
  );
}

function RedeemedBenefitView({ benefit }: GeneratedBenefitViewProps) {
  const t = useTranslations("benefits");
  const locale = useLocale();

  return (
    <Card className="w-full gap-0 py-0 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-(--card-spacing) py-(--card-spacing)">
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
                    ? formatBenefitDate(
                        benefit.redeemedAt,
                        toIntlLocale(locale)
                      )
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="flex items-center border-t border-border/60 p-(--card-spacing) lg:w-80 lg:shrink-0 lg:border-t-0 lg:border-l lg:border-border/60">
          {benefit.transactionHash ? (
            <div className="w-full space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
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
            <div className="w-full space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4">
              <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {t("onChainProof")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("txUnavailable")}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
