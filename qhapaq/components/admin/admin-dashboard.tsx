"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { FundingProgress } from "@/components/project/funding-progress";
import { MilestoneDetailDialog } from "@/components/milestones/milestone-detail-dialog";
import { MilestoneList } from "@/components/milestones/milestone-list";
import { useMilestones } from "@/components/milestones/milestones-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useFundingProgress } from "@/hooks/use-funding-progress";
import { useLocalizedProject } from "@/hooks/use-localized-project";
import { useUserRole } from "@/hooks/use-user-role";
import { Link } from "@/i18n/navigation";
import { formatQrp } from "@/lib/project/data";
import { stellarConfig } from "@/lib/stellar/config";
import { shortenAddress } from "@/lib/stellar/wallet";

export function AdminDashboard() {
  const t = useTranslations("admin");
  const tProject = useTranslations("project");
  const tMilestones = useTranslations("milestones");
  const locale = useLocale();
  const { isAdmin, isConnected, isLoading, address } = useUserRole();
  const project = useLocalizedProject();
  const funding = useFundingProgress();
  const {
    milestones,
    approvedCount,
    pendingCount,
    totalCount,
    approveMilestone,
  } = useMilestones();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const selectedMilestone = useMemo(
    () => milestones.find((m) => m.id === selectedId) ?? null,
    [milestones, selectedId]
  );

  const handleViewDetails = useCallback((id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  }, []);

  const handleApprove = useCallback(
    (id: string) => {
      if (!address || !isAdmin) return;
      setApprovingId(id);
      approveMilestone(id, address);
      setApprovingId(null);
    },
    [address, isAdmin, approveMilestone]
  );

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 sm:px-8">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!isConnected || !isAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12 sm:px-8">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("accessDeniedTitle")}
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("unauthorizedTitle")}</AlertTitle>
          <AlertDescription>
            {!isConnected
              ? t("connectAdminWallet")
              : t("unauthorizedDescription")}
          </AlertDescription>
        </Alert>
        <div>
          <Link href="/">
            <Button variant="outline">{t("backHome")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const locationLabel = `${project.location}, ${project.region}`;
  const fundingRaised = funding.raised ?? 0;
  const fundingGoal = funding.goal ?? project.fundingTarget;
  const fundingSummary =
    funding.isLoading || funding.error
      ? "—"
      : `${formatQrp(fundingRaised, locale)} / ${formatQrp(fundingGoal, locale)} ${project.token}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10 sm:px-8 sm:py-12">
      <header className="space-y-2 border-b border-border/70 pb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("description")}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm text-muted-foreground">
          <p>
            <span className="text-foreground">{t("currentProject")}:</span>{" "}
            {project.name}
          </p>
          {address ? (
            <p>
              {t("adminWallet", { address: shortenAddress(address, 4) })}
            </p>
          ) : null}
        </div>
      </header>

      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {t("projectSummary")}
          </p>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {project.name}
          </h2>
        </div>

        <dl className="grid gap-4 border-y border-border/70 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-0.5">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">
              {tProject("location")}
            </dt>
            <dd className="font-medium">{locationLabel}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">
              {tProject("token")}
            </dt>
            <dd className="font-medium">{project.token}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">
              {t("fundingLabel")}
            </dt>
            <dd className="font-medium tabular-nums">{fundingSummary}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">
              {t("networkLabel")}
            </dt>
            <dd className="font-medium">{stellarConfig.displayName}</dd>
          </div>
        </dl>

        <FundingProgress project={project} funding={funding} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {tMilestones("summaryLabel")}
            </p>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {tMilestones("summaryTitle")}
            </h2>
          </div>
          <p className="font-heading text-lg font-semibold tabular-nums">
            {t("milestonesSummary", {
              approved: approvedCount,
              total: totalCount,
            })}
          </p>
        </div>

        <dl className="grid max-w-sm grid-cols-2 gap-4 text-sm">
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">{tMilestones("approved")}</dt>
            <dd className="font-heading text-xl font-semibold tabular-nums">
              {approvedCount}
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">{tMilestones("pending")}</dt>
            <dd className="font-heading text-xl font-semibold tabular-nums">
              {pendingCount}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {tMilestones("title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {tMilestones("localApprovalNote")}
          </p>
        </div>

        <MilestoneList
          milestones={milestones}
          canApprove
          onViewDetails={handleViewDetails}
        />
      </section>

      <MilestoneDetailDialog
        milestone={selectedMilestone}
        open={detailOpen && Boolean(selectedMilestone)}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedId(null);
        }}
        canApprove
        onApprove={handleApprove}
        isApproving={
          selectedMilestone
            ? approvingId === selectedMilestone.id
            : false
        }
      />
    </div>
  );
}
