"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ParticipateDialog } from "@/components/project/participate-dialog";
import { Link } from "@/i18n/navigation";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { estimateUsdValue, type ProjectData } from "@/lib/project/data";

type InvestmentCardProps = {
  project: ProjectData;
  address: string | null;
  isConnected: boolean;
  isTestnet: boolean;
  onPurchaseSuccess?: () => Promise<void> | void;
};

export function InvestmentCard({
  project,
  address,
  isConnected,
  isTestnet,
  onPurchaseSuccess,
}: InvestmentCardProps) {
  const t = useTranslations("investment");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const { formatted, balance, hasTrustline, isLoading, error, refresh } =
    useQrpBalance(isConnected && isTestnet ? address : null);

  async function handlePurchaseSuccess() {
    await refresh();
    await onPurchaseSuccess?.();
  }

  return (
    <>
      <div className="flex w-full flex-col gap-5 border-t border-border/60 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{t("yourParticipation")}</p>
          {!isConnected ? (
            <p className="font-heading text-3xl font-semibold tracking-tight text-muted-foreground sm:text-4xl">
              {t("connectWallet")}
            </p>
          ) : !isTestnet ? (
            <p className="font-heading text-3xl font-semibold tracking-tight text-destructive sm:text-4xl">
              {t("switchToTestnet")}
            </p>
          ) : isLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : error ? (
            <p className="font-heading text-3xl font-semibold tracking-tight text-destructive sm:text-4xl">
              —
            </p>
          ) : (
            <>
              <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                {formatted ?? "0"}{" "}
                <span className="text-base font-normal text-muted-foreground sm:text-lg">
                  {project.token}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                ≈{" "}
                {estimateUsdValue(
                  balance ?? "0",
                  project.referenceValueUsd,
                  locale
                )}
              </p>
            </>
          )}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {project.mainBenefit}
        </p>

        <div className="flex flex-col gap-2">
          <Button className="w-full" size="lg" onClick={() => setOpen(true)}>
            {isConnected && isTestnet && hasTrustline === false
              ? t("addQrp")
              : t("participate")}
          </Button>
          <Link href="/benefits" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              {t("viewBenefits")}
            </Button>
          </Link>
        </div>
      </div>

      <ParticipateDialog
        open={open}
        onOpenChange={setOpen}
        project={project}
        investorAddress={address}
        formattedBalance={formatted}
        hasTrustline={hasTrustline}
        isConnected={isConnected}
        isTestnet={isTestnet}
        isLoadingBalance={isLoading}
        onPurchaseSuccess={handlePurchaseSuccess}
        onTrustlineSuccess={refresh}
      />
    </>
  );
}
