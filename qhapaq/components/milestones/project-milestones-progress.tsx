"use client";

import { useTranslations } from "next-intl";
import { MilestoneList } from "@/components/milestones/milestone-list";
import { useMilestones } from "@/components/milestones/milestones-provider";

/** Read-only milestone progress for the participant project page. */
export function ProjectMilestonesProgress() {
  const t = useTranslations("milestones");
  const { milestones, approvedCount, totalCount } = useMilestones();

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {t("projectProgressLabel")}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {t("projectProgressTitle")}
          </h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {t("approvedCount", {
              approved: approvedCount,
              total: totalCount,
            })}
          </p>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("prototypeNote")}
        </p>
      </div>

      {/* Participants see status only — no approve actions. */}
      <MilestoneList milestones={milestones} variant="compact" />
    </section>
  );
}
