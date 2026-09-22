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
  /** Monumental % as the page hero. Compact keeps a quieter inline read. */
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
    <section className={cn("space-y-8", className)}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-12">
        <div className="min-w-0 space-y-3">
          {isLoading ? (
            <Skeleton className="h-24 w-48 sm:h-28" />
          ) : error ? (
            <p
              className="font-heading text-7xl font-semibold tracking-tighter text-muted-foreground tabular-nums sm:text-8xl lg:text-9xl"
              aria-hidden
            >
              —
            </p>
          ) : (
            <p className="font-heading text-7xl font-semibold tracking-tighter text-primary tabular-nums sm:text-8xl lg:text-[7.5rem] lg:leading-none">
              {pct}
              <span className="text-[0.55em]">%</span>
            </p>
          )}
          <p className="max-w-sm font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("heroStatement", { projectName: project.name })}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:items-end lg:text-right">
          {isLoading ? (
            <Skeleton className="h-6 w-56" />
          ) : error ? (
            <Alert variant="destructive" className="text-left">
              <AlertCircle />
              <AlertTitle>{t("errorTitle")}</AlertTitle>
              <AlertDescription>{t("errorDescription")}</AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                {formatQrp(raised ?? 0, locale)}
                <span className="text-lg font-normal text-muted-foreground">
                  {" "}
                  / {formatQrp(displayGoal, locale)} {project.token}
                </span>
              </p>
              {/*<p className="max-w-xs text-sm leading-relaxed text-muted-foreground lg:ml-auto">
                {t("footnote", {
                  projectName: project.name,
                  token: project.token,
                })}
              </p>*/}
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("loading")}
        </div>
      ) : !error ? (
        <Progress value={pct} className="w-full">
          <ProgressLabel className="sr-only">{t("completion")}</ProgressLabel>
          <ProgressValue />
        </Progress>
      ) : null}
    </section>
  );
}
