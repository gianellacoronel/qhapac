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
import { toIntlLocale } from "@/lib/project/data";
import { shortenAddress } from "@/lib/stellar/wallet";
import type { Milestone } from "@/lib/milestones/types";
import { cn } from "@/lib/utils";

type MilestoneDetailDialogProps = {
  milestone: Milestone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canApprove?: boolean;
  onApprove?: (id: string) => void;
  isApproving?: boolean;
};

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDay(isoDate: string, locale: string): string {
  // Expected dates are YYYY-MM-DD — append noon UTC to avoid timezone shift.
  const date = new Date(
    isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00.000Z`
  );
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function MilestoneDetailDialog({
  milestone,
  open,
  onOpenChange,
  canApprove = false,
  onApprove,
  isApproving = false,
}: MilestoneDetailDialogProps) {
  const t = useTranslations("milestones");
  const locale = useLocale();
  const [confirming, setConfirming] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirming(false);
      setEvidenceOpen(false);
    }
  }, [open]);

  useEffect(() => {
    setConfirming(false);
    setEvidenceOpen(false);
  }, [milestone?.id]);

  if (!milestone) return null;

  const approved = milestone.status === "approved";
  const title = t(`items.${milestone.id}.title`);
  const description = t(`items.${milestone.id}.description`);
  const evidenceTitle = t(`items.${milestone.id}.evidenceTitle`);
  const evidenceDescription = t(`items.${milestone.id}.evidenceDescription`);

  const approvedByText =
    !milestone.approvedBy || milestone.approvedBy === "prototype"
      ? t("approvedByAdminWallet")
      : t("approvedByAddress", {
          address: shortenAddress(milestone.approvedBy, 4),
        });

  const handleConfirmApprove = () => {
    if (!onApprove || !canApprove || approved) return;
    onApprove(milestone.id);
    setConfirming(false);
  };

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
                  approved ? "text-primary" : "text-muted-foreground"
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
                  <dd>{formatDate(milestone.approvedAt, locale)}</dd>
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

              {milestone.transactionHash ? (
                <div className="space-y-0.5 sm:col-span-2">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {t("transactionHash")}
                  </dt>
                  <dd className="break-all font-mono text-xs">
                    {milestone.transactionHash}
                  </dd>
                </div>
              ) : null}
            </dl>

            {milestone.evidence?.mock ? (
              <div className="space-y-2 border-t border-border/70 pt-4">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  {t("evidence")}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium">{evidenceTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("evidencePrototypeNote")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEvidenceOpen(true)}
                  >
                    {t("viewEvidence")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            {confirming ? (
              <div className="flex w-full flex-col gap-3 sm:items-end">
                <p className="text-sm text-muted-foreground sm:text-right">
                  {t("confirmApprovalDescription", { title })}
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isApproving}
                    onClick={() => setConfirming(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="button"
                    disabled={isApproving}
                    onClick={handleConfirmApprove}
                  >
                    {t("confirmApproval")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t("close")}
                </Button>
                {canApprove && !approved && onApprove ? (
                  <Button type="button" onClick={() => setConfirming(true)}>
                    {t("approve")}
                  </Button>
                ) : null}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>{t("evidence")}</DialogTitle>
            <DialogDescription>{t("evidencePrototypeNote")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="font-medium">{evidenceTitle}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {evidenceDescription}
            </p>
          </div>
          <DialogFooter>
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
