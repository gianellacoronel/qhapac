"use client";

import { useState } from "react";
import { BenefitCard } from "@/components/benefits/benefit-card";
import { FundingProgress } from "@/components/project/funding-progress";
import { InvestmentCard } from "@/components/project/investment-card";
import { ParticipateDialog } from "@/components/project/participate-dialog";
import { ProjectHero } from "@/components/project/project-hero";
import { ProjectOverview } from "@/components/project/project-overview";
import { Button } from "@/components/ui/button";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { useWallet } from "@/hooks/use-wallet";
import { huaralResort } from "@/lib/project/data";
import { Sparkles } from "lucide-react";

export function ProjectPage() {
  const wallet = useWallet();
  const [participateOpen, setParticipateOpen] = useState(false);
  const balanceState = useQrpBalance(
    wallet.isConnected && wallet.isTestnet ? wallet.address : null,
  );

  const previewBenefits = huaralResort.benefits.slice(0, 2);

  return (
    <div className="flex flex-1 flex-col">
      <ProjectHero project={huaralResort} />

      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14 lg:py-20">
        <div className="flex flex-col gap-12">
          <FundingProgress project={huaralResort} />
          <ProjectOverview project={huaralResort} />

          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Benefits preview
                </p>
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  What participation unlocks
                </h2>
              </div>
              <Button
                className="hidden sm:inline-flex"
                onClick={() => setParticipateOpen(true)}
              >
                Participate
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {previewBenefits.map((benefit) => (
                <BenefitCard key={benefit.id} benefit={benefit} />
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <InvestmentCard
            project={huaralResort}
            address={wallet.address}
            isConnected={wallet.isConnected}
            isTestnet={wallet.isTestnet}
          />
        </aside>
      </div>

      <ParticipateDialog
        open={participateOpen}
        onOpenChange={setParticipateOpen}
        project={huaralResort}
        investorAddress={wallet.address}
        formattedBalance={balanceState.formatted}
        hasTrustline={balanceState.hasTrustline}
        isConnected={wallet.isConnected}
        isTestnet={wallet.isTestnet}
        isLoadingBalance={balanceState.isLoading}
        onPurchaseSuccess={balanceState.refresh}
      />
    </div>
  );
}
