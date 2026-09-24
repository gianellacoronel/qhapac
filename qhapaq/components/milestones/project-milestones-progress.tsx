"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MilestoneDetailDialog } from "@/components/milestones/milestone-detail-dialog";
import { MilestoneList } from "@/components/milestones/milestone-list";
import { useMilestones } from "@/components/milestones/milestones-provider";
import { hasOnChainApproval } from "@/lib/milestones/data";

/** Read-only milestone progress for the participant project page. */
export function ProjectMilestonesProgress() {
  const t = useTranslations("milestones");
  const { milestones, approvedCount, totalCount } = useMilestones();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const nextPending = milestones.find((m) => !hasOnChainApproval(m));
  const nextTitle = nextPending
    ? t(`items.${nextPending.id}.title`)
    : t("allApproved");

  const selectedMilestone = useMemo(
    () => milestones.find((m) => m.id === selectedId) ?? null,
    [milestones, selectedId],
  );

  return (
    <>
      <section className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("projectProgressTitle")}
            </h2>
            <p className="max-w-md font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {nextPending ? t("nextUp", { title: nextTitle }) : nextTitle}
            </p>
          </div>
          <p className="font-heading text-5xl font-semibold tracking-tight tabular-nums text-primary sm:text-6xl">
            {approvedCount}
            <span className="text-[0.5em] font-medium text-muted-foreground">
              {" "}
              / {totalCount}
            </span>
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("prototypeNote")}
          </p>
        </div>

        {/* Participants see status only — no approve actions. */}
        <MilestoneList
          milestones={milestones}
          variant="compact"
          onViewDetails={(id) => {
            setSelectedId(id);
            setDetailOpen(true);
          }}
        />
      </section>

      <MilestoneDetailDialog
        milestone={selectedMilestone}
        open={detailOpen && Boolean(selectedMilestone)}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}
