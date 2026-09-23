"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionLink } from "@/components/wallet/transaction-link";
import { stellarRichTag } from "@/components/stellar-help";
import { toIntlLocale } from "@/lib/project/data";
import { shortenHash } from "@/lib/stellar/explorer";
import { shortenAddress } from "@/lib/stellar/wallet";
import { hasOnChainApproval } from "@/lib/milestones/data";
import { isMilestoneEvidence } from "@/lib/milestones/evidence";
import type { Milestone } from "@/lib/milestones/types";
import { cn } from "@/lib/utils";

export type MilestoneApprovalPhase =
  | "idle"
  | "preparing"
  | "uploading"
  | "recording"
  | "confirming"
  | "success"
  | "error";

type MilestoneDetailDialogProps = {
  milestone: Milestone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canApprove?: boolean;
  onApproveRequest?: (id: string) => void;
  isApproving?: boolean;
  approvalPhase?: MilestoneApprovalPhase;
  approvalError?: string | null;
};

function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDay(isoDate: string, locale: string): string {
  const date = new Date(
    isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00.000Z`,
  );
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function MilestoneDetailDialog({
  milestone,
  open,
  onOpenChange,
  canApprove = false,
  onApproveRequest,
  isApproving = false,
  approvalPhase = "idle",
  approvalError = null,
}: MilestoneDetailDialogProps) {
  const t = useTranslations("milestones");
  const locale = useLocale();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  useEffect(() => {
    if (!open) setEvidenceOpen(false);
  }, [open]);

  useEffect(() => {
    setEvidenceOpen(false);
  }, [milestone?.id]);

  if (!milestone) return null;

  const approved = hasOnChainApproval(milestone);
  const title = t(`items.${milestone.id}.title`);
  const description = t(`items.${milestone.id}.description`);
  const evidence = isMilestoneEvidence(milestone.evidence)
    ? milestone.evidence
    : null;

  const approvedByText =
    !milestone.approvedBy || milestone.approvedBy === "prototype"
      ? t("approvedByAdminWallet")
      : t("approvedByAddress", {
          address: shortenAddress(milestone.approvedBy, 4),
        });

  const approveButtonLabel =
    approvalPhase === "preparing"
      ? t("phasePreparing")
      : approvalPhase === "uploading"
        ? t("phaseUploading")
        : approvalPhase === "recording"
          ? t("phaseRecording")
          : approvalPhase === "confirming"
            ? t("phaseConfirming")
            : approvalPhase === "success" || approved
              ? t("approved")
              : t("approve");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>{t("detailsTitle")}</DialogTitle>
            <DialogDescription>{t("detailsDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-heading text-lg font-semibold tracking-tight">
                  {title}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium tracking-wide uppercase",
                  approved ? "text-primary" : "text-muted-foreground",
                )}
              >
                {approved ? t("approved") : t("pending")}
              </span>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {milestone.expectedDate ? (
                <div className="space-y-0.5">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {t("expectedDate")}
                  </dt>
                  <dd>{formatDay(milestone.expectedDate, locale)}</dd>
                </div>
              ) : null}

              {approved && milestone.approvedAt ? (
                <div className="space-y-0.5">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {t("approvedAtLabel")}
                  </dt>
                  <dd>{formatDateTime(milestone.approvedAt, locale)}</dd>
                </div>
              ) : null}

              {approved && milestone.approvedBy ? (
                <div className="space-y-0.5 sm:col-span-2">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {t("approvedByLabel")}
                  </dt>
                  <dd>{approvedByText}</dd>
                </div>
              ) : null}

              {approved && evidence ? (
                <div className="space-y-2 sm:col-span-2">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {t("evidence")}
                  </dt>
                  <dd className="space-y-2">
                    <p className="text-sm font-medium">{evidence.fileName}</p>
                    <div className="space-y-0.5">
                      <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        {t("evidenceDescriptionLabel")}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {evidence.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEvidenceOpen(true)}
                      >
                        {t("viewEvidence")}
                      </Button>
                      <a
                        href={evidence.gatewayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                      >
                        <Button type="button" size="sm" variant="outline">
                          {t("openEvidenceFile")}
                        </Button>
                      </a>
                    </div>
                  </dd>
                </div>
              ) : null}

              {approved ? (
                <div className="space-y-2 sm:col-span-2">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {t("blockchainProof")}
                  </dt>
                  {milestone.transactionHash ? (
                    <dd className="space-y-2">
                      <p className="text-sm text-foreground">
                        {t("approvalPublicNote")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.rich("stellarTechnicalNote", stellarRichTag())}
                      </p>
                      <p className="break-all font-mono text-xs text-muted-foreground">
                        {t("transactionLabel", {
                          hash: shortenHash(milestone.transactionHash),
                        })}
                      </p>
                      <TransactionLink
                        hash={milestone.transactionHash}
                        label={t("viewApprovalRecord")}
                      />
                    </dd>
                  ) : (
                    <dd className="text-sm text-muted-foreground">
                      {t.rich("noBlockchainProof", stellarRichTag())}
                    </dd>
                  )}
                </div>
              ) : null}
            </dl>

            {approvalError ? (
              <p className="text-sm text-destructive" role="alert">
                {approvalError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isApproving}
                onClick={() => onOpenChange(false)}
              >
                {t("close")}
              </Button>
              {canApprove && !approved && onApproveRequest ? (
                <Button
                  type="button"
                  disabled={isApproving}
                  onClick={() => onApproveRequest(milestone.id)}
                >
                  {approveButtonLabel}
                </Button>
              ) : null}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>{t("evidence")}</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          {evidence ? (
            <dl className="space-y-3 text-sm">
              <div className="space-y-0.5">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                  {t("evidenceFileLabel")}
                </dt>
                <dd className="font-medium">{evidence.fileName}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                  {t("evidenceDescriptionLabel")}
                </dt>
                <dd className="leading-relaxed text-muted-foreground">
                  {evidence.description}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                  {t("evidenceCid")}
                </dt>
                <dd className="break-all font-mono text-xs text-muted-foreground">
                  {evidence.cid}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                  {t("evidenceHash")}
                </dt>
                <dd className="break-all font-mono text-xs text-muted-foreground">
                  {evidence.contentHash}
                </dd>
              </div>
              {milestone.approvedAt ? (
                <div className="space-y-0.5">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {t("approvedAtLabel")}
                  </dt>
                  <dd>{formatDateTime(milestone.approvedAt, locale)}</dd>
                </div>
              ) : null}
              {milestone.transactionHash ? (
                <div className="space-y-2">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {t("blockchainProof")}
                  </dt>
                  <dd>
                    <TransactionLink
                      hash={milestone.transactionHash}
                      label={t("viewApprovalRecord")}
                    />
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("evidenceUnavailable")}
            </p>
          )}
          <DialogFooter>
            {evidence ? (
              <a
                href={evidence.gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button type="button">{t("openEvidenceFile")}</Button>
              </a>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setEvidenceOpen(false)}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
