"use client";

import { Check, Circle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TransactionLink } from "@/components/wallet/transaction-link";
import { toIntlLocale } from "@/lib/project/data";
import { shortenAddress } from "@/lib/stellar/wallet";
import type { Milestone } from "@/lib/milestones/types";
import { cn } from "@/lib/utils";

type MilestoneListProps = {
  milestones: Milestone[];
  /** When true, show admin actions (view details + approve path). */
  canApprove?: boolean;
  /** Compact list for participant project progress. */
  variant?: "full" | "compact";
  onViewDetails?: (id: string) => void;
};

function formatApprovedAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function MilestoneList({
  milestones,
  canApprove = false,
  variant = "full",
  onViewDetails,
}: MilestoneListProps) {
  const t = useTranslations("milestones");
  const locale = useLocale();
  const compact = variant === "compact";

  return (
    <ol className="space-y-0 divide-y divide-border/60">
      {milestones.map((milestone) => {
        const approved = milestone.status === "approved";
        const title = t(`items.${milestone.id}.title`);
        const description = t(`items.${milestone.id}.description`);
        const approvedByText =
          !milestone.approvedBy || milestone.approvedBy === "prototype"
            ? t("approvedByAdminWallet")
            : t("approvedByAddress", {
                address: shortenAddress(milestone.approvedBy, 4),
              });

        return (
          <li
            key={milestone.id}
            className={cn(
              "grid gap-3 py-4 first:pt-4 last:pb-4",
              compact
                ? "grid-cols-[auto_1fr] items-start"
                : "grid-cols-[auto_1fr] items-start sm:grid-cols-[auto_1fr_auto]"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                approved
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
              aria-hidden
            >
              {approved ? (
                <Check className="size-3.5 stroke-[2.5]" />
              ) : (
                <Circle className="size-3.5" />
              )}
            </span>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-foreground">{title}</p>
                {!compact ? (
                  <span
                    className={cn(
                      "text-xs font-medium tracking-wide uppercase sm:hidden",
                      approved ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {approved ? t("approved") : t("pending")}
                  </span>
                ) : null}
              </div>

              {!compact ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}

              {approved && compact ? (
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="text-xs font-medium tracking-wide text-primary uppercase">
                    {t("approved")}
                  </p>
                  {milestone.approvedAt ? (
                    <p>{formatApprovedAt(milestone.approvedAt, locale)}</p>
                  ) : null}
                  <p>{approvedByText}</p>
                  {milestone.transactionHash ? (
                    <TransactionLink
                      hash={milestone.transactionHash}
                      label={t("viewBlockchainProof")}
                    />
                  ) : (
                    <p className="text-xs">{t("noBlockchainProof")}</p>
                  )}
                </div>
              ) : null}

              {approved && !compact ? (
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                  <p>{approvedByText}</p>
                  {milestone.approvedAt ? (
                    <p>
                      {t("approvedAt", {
                        date: formatApprovedAt(milestone.approvedAt, locale),
                      })}
                    </p>
                  ) : null}
                  {milestone.transactionHash ? (
                    <TransactionLink
                      hash={milestone.transactionHash}
                      label={t("viewBlockchainProof")}
                    />
                  ) : null}
                </div>
              ) : null}

              {!compact && onViewDetails ? (
                <div className="pt-1 sm:hidden">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(milestone.id)}
                  >
                    {t("viewDetails")}
                  </Button>
                </div>
              ) : null}
            </div>

            {!compact ? (
              <div className="hidden flex-col items-end gap-2 sm:flex">
                <span
                  className={cn(
                    "text-xs font-medium tracking-wide uppercase",
                    approved ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {approved ? t("approved") : t("pending")}
                </span>
                {onViewDetails || canApprove ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails?.(milestone.id)}
                    disabled={!onViewDetails}
                  >
                    {t("viewDetails")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
