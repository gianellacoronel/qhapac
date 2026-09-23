"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { FundingProgressState } from "@/hooks/use-funding-progress";
import { formatQrp, type ProjectData } from "@/lib/project/data";
import { cn } from "@/lib/utils";

type FundingProgressProps = {
  project: ProjectData;
  funding: FundingProgressState;
  /** Column layout for the project hero; compact keeps a quieter inline read. */
  variant?: "hero" | "compact";
  className?: string;
};

export function FundingProgress({
  project,
  funding,
  variant = "hero",
  className,
}: FundingProgressProps) {
  const t = useTranslations("funding");
  const locale = useLocale();
  const { raised, goal, percentage, isLoading, error } = funding;
  const displayGoal = goal ?? project.fundingTarget;
  const pct = percentage ?? 0;

  if (variant === "compact") {
    return (
      <section className={cn("space-y-3", className)}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : error ? (
            <p className="font-heading text-2xl font-semibold tabular-nums text-muted-foreground">
              —
            </p>
          ) : (
            <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              <span className="text-primary">{pct}%</span>
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {t("funded")}
              </span>
            </p>
          )}
          {!isLoading && !error ? (
            <p className="text-sm tabular-nums text-muted-foreground">
              {formatQrp(raised ?? 0, locale)} /{" "}
              {formatQrp(displayGoal, locale)} {project.token}
            </p>
          ) : null}
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{t("errorTitle")}</AlertTitle>
            <AlertDescription>{t("errorDescription")}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("loading")}
          </div>
        ) : (
          <Progress value={pct} className="w-full">
            <ProgressLabel className="sr-only">{t("completion")}</ProgressLabel>
            <ProgressValue />
          </Progress>
        )}
      </section>
    );
  }

  return (
    <section className={cn("flex flex-col gap-5", className)}>
      <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {t("label")}
      </p>

      <div className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-36" />
        ) : error ? (
          <p
            className="font-heading text-5xl font-semibold tracking-tighter text-muted-foreground tabular-nums sm:text-6xl"
            aria-hidden
          >
            —
          </p>
        ) : (
          <p className="font-heading text-5xl font-semibold tracking-tighter text-primary tabular-nums sm:text-6xl sm:tracking-tighter">
            {pct}
            <span className="text-[0.55em]">%</span>
          </p>
        )}
        <p className="max-w-sm font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {t("heroStatement", { projectName: project.name })}
        </p>
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
        <div className="space-y-3">
          <p className="font-heading text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
            {formatQrp(raised ?? 0, locale)}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {formatQrp(displayGoal, locale)} {project.token}
            </span>
          </p>
          <Progress value={pct} className="w-full">
            <ProgressLabel className="sr-only">{t("completion")}</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
      )}
    </section>
  );
}
