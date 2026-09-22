"use client";

import { Gift, Percent } from "lucide-react";
import { useTranslations } from "next-intl";
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
import type { BenefitDefinition, BenefitStatus } from "@/lib/benefits/types";

type AvailableBenefitCardProps = {
  benefit: BenefitDefinition;
  status: BenefitStatus;
  participationLabel: string;
  onGenerate: () => void;
  onViewGenerated: () => void;
};

export function AvailableBenefitCard({
  benefit,
  status,
  participationLabel,
  onGenerate,
  onViewGenerated,
}: AvailableBenefitCardProps) {
  const t = useTranslations("benefits");

  const statusLabel =
    status === "redeemed"
      ? t("status.redeemed")
      : status === "generated"
        ? t("status.generated")
        : t("status.available");

  const validFor = t.has(`definitions.${benefit.id}.validFor`)
    ? t(`definitions.${benefit.id}.validFor`)
    : benefit.validFor;

  const actionButton =
    status === "available" ? (
      <Button className="w-full sm:w-auto" onClick={onGenerate}>
        {t("generate")}
      </Button>
    ) : (
      <Button
        className="w-full sm:w-auto"
        variant="outline"
        onClick={onViewGenerated}
      >
        {t("viewBenefit")}
      </Button>
    );

  return (
    <Card className="w-full gap-0 py-0 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-(--card-spacing) py-(--card-spacing)">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardDescription className="flex items-center gap-1.5">
                  <Gift className="size-3.5 text-primary" aria-hidden />
                  {benefit.projectName}
                </CardDescription>
                <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
                  {t("percentOff", { discount: benefit.discount })}
                </CardTitle>
              </div>
              <Badge
                variant={status === "available" ? "secondary" : "outline"}
                className={
                  status === "available"
                    ? "bg-accent text-accent-foreground"
                    : undefined
                }
              >
                {statusLabel}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Percent className="size-4 text-primary" aria-hidden />
              {validFor}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("yourParticipation", { label: participationLabel })}
            </p>
          </CardContent>
        </div>

        <CardFooter className="border-t border-border/60 py-(--card-spacing) lg:w-56 lg:shrink-0 lg:flex-col lg:items-stretch lg:justify-center lg:border-t-0 lg:border-l lg:border-border/60">
          {actionButton}
        </CardFooter>
      </div>
    </Card>
  );
}

export function formatParticipationLabel(
  formatted: string | null,
  token: string,
  isConnected: boolean,
  connectLabel: string
): string {
  if (!isConnected) return connectLabel;
  if (!formatted) return `0 ${token}`;
  return `${formatted} ${token}`;
}
