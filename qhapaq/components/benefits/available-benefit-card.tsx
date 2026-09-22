"use client";

import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="grid gap-4 border-b border-border/70 py-6 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Gift className="size-3.5 text-primary" aria-hidden />
            {benefit.projectName}
          </p>
          <Badge
            variant={status === "available" ? "secondary" : "outline"}
            className={
              status === "available" ? "bg-primary/20 text-foreground" : undefined
            }
          >
            {statusLabel}
          </Badge>
        </div>
        <p className="font-heading text-2xl font-semibold tracking-tight">
          {t("percentOff", { discount: benefit.discount })}
        </p>
        <p className="text-sm text-muted-foreground">{validFor}</p>
        <p className="text-sm text-muted-foreground">
          {t("yourParticipation", { label: participationLabel })}
        </p>
      </div>
      <div className="sm:justify-self-end">{actionButton}</div>
    </div>
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
