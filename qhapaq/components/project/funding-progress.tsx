"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { FundingProgressState } from "@/hooks/use-funding-progress";
import { formatQrp, type ProjectData } from "@/lib/project/data";

type FundingProgressProps = {
  project: ProjectData;
  funding: FundingProgressState;
};

export function FundingProgress({ project, funding }: FundingProgressProps) {
  const t = useTranslations("funding");
  const locale = useLocale();
  const { raised, goal, percentage, isLoading, error } = funding;
  const displayGoal = goal ?? project.fundingTarget;

  return (
    <section className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {t("label")}
          </p>
          {isLoading ? (
            <Skeleton className="h-9 w-48" />
          ) : error ? (
            <p className="font-heading text-2xl font-semibold tracking-tight text-muted-foreground sm:text-3xl">
              —{" "}
              <span className="text-lg font-normal">
                / {formatQrp(displayGoal, locale)} {project.token}
              </span>
            </p>
          ) : (
            <p className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {formatQrp(raised ?? 0, locale)}{" "}
              <span className="text-lg font-normal text-muted-foreground">
                / {formatQrp(displayGoal, locale)} {project.token}
              </span>
            </p>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-16" />
        ) : error ? (
          <p className="font-heading text-3xl font-semibold tabular-nums text-muted-foreground">
            —
          </p>
        ) : (
          <p className="font-heading text-3xl font-semibold tabular-nums text-primary">
            {percentage ?? 0}%
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("loading")}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>{t("errorDescription")}</AlertDescription>
        </Alert>
      ) : (
        <Progress value={percentage ?? 0} className="w-full">
          <ProgressLabel className="sr-only">{t("completion")}</ProgressLabel>
          <ProgressValue />
        </Progress>
      )}

      <p className="text-sm text-muted-foreground">
        {t("footnote", {
          projectName: project.name,
          token: project.token,
        })}
      </p>
    </section>
  );
}
