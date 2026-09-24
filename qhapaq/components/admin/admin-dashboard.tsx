"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { FundingProgress } from "@/components/project/funding-progress";
import {
  MilestoneApproveModal,
  type ApprovalModalPhase,
  type ApproveMilestonePayload,
} from "@/components/milestones/milestone-approve-modal";
import { MilestoneDetailDialog } from "@/components/milestones/milestone-detail-dialog";
import { MilestoneList } from "@/components/milestones/milestone-list";
import { useMilestones } from "@/components/milestones/milestones-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { QrpLabel } from "@/components/qrp-help";
import { StellarNetworkLabel } from "@/components/stellar-help";
import { useFundingProgress } from "@/hooks/use-funding-progress";
import { useLocalizedProject } from "@/hooks/use-localized-project";
import { useUserRole } from "@/hooks/use-user-role";
import { Link } from "@/i18n/navigation";
import { requestMilestoneApproval } from "@/lib/milestones/approve-client";
import { hasOnChainApproval } from "@/lib/milestones/data";
import { formatQrp } from "@/lib/project/data";
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
    recordApprovedMilestone,
    refreshMilestones,
  } = useMilestones();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalPhase, setApprovalPhase] =
    useState<ApprovalModalPhase>("idle");
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const selectedMilestone = useMemo(
    () => milestones.find((m) => m.id === selectedId) ?? null,
    [milestones, selectedId],
  );

  const nextPending = useMemo(
    () => milestones.find((m) => !hasOnChainApproval(m)) ?? null,
    [milestones],
  );

  const nextPendingTitle = nextPending
    ? tMilestones(`items.${nextPending.id}.title`)
    : null;

  const approveTargetTitle = selectedMilestone
    ? tMilestones(`items.${selectedMilestone.id}.title`)
    : "";

  const resetApprovalUi = useCallback(() => {
    setApprovalPhase("idle");
    setApprovalError(null);
    setApprovingId(null);
  }, []);

  const handleViewDetails = useCallback((id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
    setApproveOpen(false);
    setApprovalPhase("idle");
    setApprovalError(null);
  }, []);

  const handleApproveRequest = useCallback((id: string) => {
    setSelectedId(id);
    setApprovalError(null);
    setApprovalPhase("idle");
    setApproveOpen(true);
  }, []);

  const mapClientError = useCallback(
    (error: string) => {
      switch (error) {
        case "already_approved":
          return tMilestones("alreadyApprovedError");
        case "config":
          return tMilestones("configError");
        case "network":
          return tMilestones("networkError");
        case "pinata_upload":
          return tMilestones("uploadFailed");
        case "stellar_submit":
          return tMilestones("stellarFailed");
        case "invalid_file":
        case "file_too_large":
          return tMilestones("validationFileType");
        case "invalid_description":
          return tMilestones("validationDescriptionRequired");
        case "in_progress":
          return tMilestones("inProgressError");
        default:
          return tMilestones("stellarFailed");
      }
    },
    [tMilestones],
  );

  const handleConfirmApprove = useCallback(
    async (payload: ApproveMilestonePayload) => {
      if (!address || !isAdmin || !selectedMilestone) return;
      if (approvingId) return;
      if (hasOnChainApproval(selectedMilestone)) {
        setApprovalError(tMilestones("alreadyApprovedError"));
        setApprovalPhase("error");
        return;
      }

      const id = selectedMilestone.id;
      setApprovingId(id);
      setApprovalError(null);
      setApprovalPhase("preparing");

      await new Promise((resolve) => setTimeout(resolve, 120));
      setApprovalPhase("uploading");

      // Network round-trip covers upload + Stellar; advance UI phases for clarity.
      const resultPromise = requestMilestoneApproval({
        milestoneId: id,
        description: payload.description,
        file: payload.file,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));
      setApprovalPhase("recording");

      const result = await resultPromise;

      if (!result.ok) {
        setApprovalPhase("error");
        setApprovalError(mapClientError(result.error));
        setApprovingId(null);
        return;
      }

      setApprovalPhase("confirming");
      await new Promise((resolve) => setTimeout(resolve, 120));

      recordApprovedMilestone(id, {
        approvedBy: result.approvedBy,
        approvedAt: result.approvedAt,
        transactionHash: result.transactionHash,
        approvalMemo: result.approvalMemo,
        evidence: result.evidence,
      });

      setApprovalPhase("success");
      setApprovingId(null);
      setApproveOpen(false);
      void refreshMilestones();
    },
    [
      address,
      isAdmin,
      selectedMilestone,
      approvingId,
      recordApprovedMilestone,
      refreshMilestones,
      mapClientError,
      tMilestones,
    ],
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

      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end lg:gap-12">
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
              <dd className="font-medium">
                <StellarNetworkLabel brief={false} />
              </dd>
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
            resetApprovalUi();
          }
        }}
        canApprove
        onApproveRequest={handleApproveRequest}
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

      <MilestoneApproveModal
        open={approveOpen && Boolean(selectedMilestone)}
        onOpenChange={(open) => {
          if (
            approvalPhase === "preparing" ||
            approvalPhase === "uploading" ||
            approvalPhase === "recording" ||
            approvalPhase === "confirming"
          ) {
            return;
          }
          setApproveOpen(open);
          if (!open && approvalPhase !== "success") {
            resetApprovalUi();
          }
        }}
        milestoneTitle={approveTargetTitle}
        phase={approvalPhase}
        error={approvalError}
        onConfirm={handleConfirmApprove}
      />
    </div>
  );
}
