"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { BenefitCard } from "@/components/benefits/benefit-card";
import { ProjectMilestonesProgress } from "@/components/milestones/project-milestones-progress";
import { FundingProgress } from "@/components/project/funding-progress";
import { InvestmentCard } from "@/components/project/investment-card";
import { ParticipateDialog } from "@/components/project/participate-dialog";
import { ProjectHero } from "@/components/project/project-hero";
import { ProjectOverview } from "@/components/project/project-overview";
import { Button } from "@/components/ui/button";
import { useFundingProgress } from "@/hooks/use-funding-progress";
import { useLocalizedProject } from "@/hooks/use-localized-project";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { useWallet } from "@/hooks/use-wallet";

export function ProjectPage() {
  const t = useTranslations("project");
  const project = useLocalizedProject();
  const wallet = useWallet();
  const [participateOpen, setParticipateOpen] = useState(false);
  const funding = useFundingProgress();
  const balanceState = useQrpBalance(
    wallet.isConnected && wallet.isTestnet ? wallet.address : null,
  );

  const previewBenefits = project.benefits.slice(0, 2);

  const handlePurchaseSuccess = useCallback(async () => {
    await Promise.all([balanceState.refresh(), funding.refresh()]);
  }, [balanceState.refresh, funding.refresh]);

  return (
    <div className="flex flex-1 flex-col">
      <ProjectHero
        project={project}
        aside={
          <InvestmentCard
            project={project}
            address={wallet.address}
            isConnected={wallet.isConnected}
            isTestnet={wallet.isTestnet}
            onPurchaseSuccess={funding.refresh}
          />
        }
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 sm:px-8 sm:py-16 lg:gap-14 lg:py-20">
        <FundingProgress project={project} funding={funding} />

        <ProjectMilestonesProgress />

        <div className="grid gap-12 lg:items-start lg:gap-14">
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {t("benefitsPreviewLabel")}
                </p>
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {t("benefitsPreviewTitle")}
                </h2>
              </div>
              <Button
                className="hidden sm:inline-flex"
                onClick={() => setParticipateOpen(true)}
              >
                {t("participate")}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {previewBenefits.map((benefit) => (
                <BenefitCard key={benefit.id} benefit={benefit} />
              ))}
            </div>
          </section>
        </div>
        <ProjectOverview project={project} />
      </div>

      <ParticipateDialog
        open={participateOpen}
        onOpenChange={setParticipateOpen}
        project={project}
        investorAddress={wallet.address}
        formattedBalance={balanceState.formatted}
        hasTrustline={balanceState.hasTrustline}
        isConnected={wallet.isConnected}
        isTestnet={wallet.isTestnet}
        isLoadingBalance={balanceState.isLoading}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </div>
  );
}
