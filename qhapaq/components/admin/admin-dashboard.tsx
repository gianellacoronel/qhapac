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
import { QrpLabel } from "@/components/qrp-help";
import { useFundingProgress } from "@/hooks/use-funding-progress";
import { useLocalizedProject } from "@/hooks/use-localized-project";
import { useUserRole } from "@/hooks/use-user-role";
import { Link } from "@/i18n/navigation";
import { requestMilestoneApproval } from "@/lib/milestones/approve-client";
import { formatQrp } from "@/lib/project/data";
import { stellarConfig } from "@/lib/stellar/config";
import { shortenAddress } from "@/lib/stellar/wallet";

export type ApprovalUiPhase =
  | "idle"
  | "approving"
  | "confirming"
  | "success"
  | "error";

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
    recordApprovedMilestone,
  } = useMilestones();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalPhase, setApprovalPhase] = useState<ApprovalUiPhase>("idle");
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const selectedMilestone = useMemo(
    () => milestones.find((m) => m.id === selectedId) ?? null,
    [milestones, selectedId],
  );

  const nextPending = useMemo(
    () => milestones.find((m) => m.status === "pending") ?? null,
    [milestones],
  );

  const nextPendingTitle = nextPending
    ? tMilestones(`items.${nextPending.id}.title`)
    : null;

  const handleViewDetails = useCallback((id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
    setApprovalPhase("idle");
    setApprovalError(null);
  }, []);

  const handleApprove = useCallback(
    async (id: string) => {
      if (!address || !isAdmin) return;
      if (approvingId) return;

      setApprovingId(id);
      setApprovalError(null);
      setApprovalPhase("approving");

      // Brief UI beat before network round-trip / Horizon confirm.
      await new Promise((resolve) => setTimeout(resolve, 150));
      setApprovalPhase("confirming");

      const result = await requestMilestoneApproval(id);

      if (!result.ok) {
        setApprovalPhase("error");
        setApprovalError(
          result.error === "already_approved"
            ? tMilestones("alreadyApprovedError")
            : result.error === "config"
              ? tMilestones("configError")
              : result.error === "network"
                ? tMilestones("networkError")
                : tMilestones("approvalFailed"),
        );
        setApprovingId(null);
        return;
      }

      recordApprovedMilestone(id, {
        approvedBy: result.approvedBy,
        approvedAt: result.approvedAt,
        transactionHash: result.transactionHash,
      });
      setApprovalPhase("success");
      setApprovingId(null);
    },
    [address, isAdmin, approvingId, recordApprovedMilestone, tMilestones],
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
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12 sm:px-8 sm:py-16">
        <div className="space-y-3">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-lg text-base text-muted-foreground">
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
      : `${formatQrp(fundingRaised, locale)} / ${formatQrp(fundingGoal, locale)}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-6 py-10 sm:px-8 sm:py-16 lg:py-20">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-end lg:gap-14">
        <div className="min-w-0 space-y-4">
          <p className="text-sm text-muted-foreground">
            {project.name}
            {address
              ? ` · ${t("adminWallet", { address: shortenAddress(address, 4) })}`
              : null}
          </p>
          {nextPending && nextPendingTitle ? (
            <>
              <p className="text-sm font-medium text-primary">
                {t("actionRequired")}
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-primary sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                {nextPendingTitle}
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                {t("nextMilestonePrompt")}
              </p>
              <Button
                className="mt-2 w-full sm:w-auto"
                onClick={() => handleViewDetails(nextPending.id)}
              >
                {tMilestones("viewDetails")}
              </Button>
            </>
          ) : (
            <>
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-primary sm:text-5xl lg:text-6xl">
                {t("allCaughtUp")}
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                {t("description")}
              </p>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2 lg:items-end lg:text-right">
          <p className="font-heading text-5xl font-semibold tracking-tighter tabular-nums text-foreground sm:text-6xl">
            {pendingCount}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {t("pendingLabel", { count: pendingCount })}
          </p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {t("milestonesSummary", {
              approved: approvedCount,
              total: totalCount,
            })}
          </p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
        <div className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {project.name}
          </h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">{tProject("location")}</dt>
              <dd className="font-medium">{locationLabel}</dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">{tProject("token")}</dt>
              <dd className="font-medium">
                <QrpLabel brief={false} />
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">{t("fundingLabel")}</dt>
              <dd className="inline-flex items-baseline gap-1 font-medium tabular-nums">
                {fundingSummary}
                {fundingSummary !== "—" ? (
                  <QrpLabel brief showHelp={false} />
                ) : null}
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">{t("networkLabel")}</dt>
              <dd className="font-medium">{stellarConfig.displayName}</dd>
            </div>
          </dl>
        </div>
        <FundingProgress
          project={project}
          funding={funding}
          variant="compact"
        />
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {tMilestones("title")}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {tMilestones("onChainApprovalNote")}
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
          if (!open) {
            setSelectedId(null);
            setApprovalPhase("idle");
            setApprovalError(null);
          }
        }}
        canApprove
        onApprove={handleApprove}
        isApproving={
          selectedMilestone ? approvingId === selectedMilestone.id : false
        }
        approvalPhase={
          selectedId === selectedMilestone?.id ? approvalPhase : "idle"
        }
        approvalError={
          selectedId === selectedMilestone?.id ? approvalError : null
        }
      />
    </div>
  );
}
