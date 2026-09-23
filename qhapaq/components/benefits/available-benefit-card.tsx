"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BenefitDefinition, BenefitStatus } from "@/lib/benefits/types";
import type { ProjectBenefit } from "@/lib/project/data";

type AvailableBenefitCardProps = {
  /** Localized project benefit for display (title, description, highlight). */
  projectBenefit: ProjectBenefit;
  /** Present when this benefit can be generated as a digital credential. */
  benefit?: BenefitDefinition;
  status?: BenefitStatus;
  onGenerate?: () => void;
  onViewGenerated?: () => void;
};

export function AvailableBenefitCard({
  projectBenefit,
  benefit,
  status,
  onGenerate,
  onViewGenerated,
}: AvailableBenefitCardProps) {
  const t = useTranslations("benefits");
  const isRedeemable = benefit != null && onGenerate != null;

  const statusLabel =
    status === "redeemed"
      ? t("status.redeemed")
      : status === "generated"
        ? t("status.generated")
        : t("status.available");

  const actionButton =
    isRedeemable && status === "available" ? (
      <Button className="w-full sm:w-auto" onClick={onGenerate}>
        {t("generate")}
      </Button>
    ) : isRedeemable && onViewGenerated ? (
      <Button
        className="w-full sm:w-auto"
        variant="outline"
        onClick={onViewGenerated}
      >
        {t("viewBenefit")}
      </Button>
    ) : null;

  return (
    <div className="grid gap-4 border-b border-border/60 py-8 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8">
      <article className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {projectBenefit.highlight ? (
            <p className="font-heading text-3xl font-semibold tracking-tight text-primary">
              {projectBenefit.highlight}
            </p>
          ) : null}
          {isRedeemable && status ? (
            <Badge
              variant={status === "available" ? "secondary" : "outline"}
              className={
                status === "available"
                  ? "bg-primary/20 text-foreground"
                  : undefined
              }
            >
              {statusLabel}
            </Badge>
          ) : null}
        </div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {projectBenefit.title}
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {projectBenefit.description}
        </p>
      </article>
      {actionButton ? (
        <div className="sm:justify-self-end">{actionButton}</div>
      ) : null}
    </div>
  );
}

export function formatParticipationLabel(
  formatted: string | null,
  token: string,
  isConnected: boolean,
  connectLabel: string,
  isLoading = false
): string {
  if (!isConnected) return connectLabel;
  if (isLoading || formatted == null) return "—";
  return `${formatted} ${token}`;
}
