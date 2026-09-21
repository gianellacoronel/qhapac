"use client";

import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AvailableBenefitCard,
  formatParticipationLabel,
} from "@/components/benefits/available-benefit-card";
import { GenerateBenefitDialog } from "@/components/benefits/generate-benefit-dialog";
import { GeneratedBenefitView } from "@/components/benefits/generated-benefit-view";
import { useBenefitSession } from "@/components/benefits/benefit-session";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { useWallet } from "@/hooks/use-wallet";
import { availableBenefits } from "@/lib/benefits/data";
import type { BenefitStatus } from "@/lib/benefits/types";
import { huaralResort } from "@/lib/project/data";

export function BenefitsPage() {
  const t = useTranslations("benefits");
  const wallet = useWallet();
  const { generatedBenefit, generateBenefit } = useBenefitSession();
  const { formatted } = useQrpBalance(
    wallet.isConnected && wallet.isTestnet ? wallet.address : null
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeDefinitionId, setActiveDefinitionId] = useState(
    availableBenefits[0]?.id ?? ""
  );
  const [showGenerated, setShowGenerated] = useState(
    () => generatedBenefit != null
  );

  const activeDefinition = useMemo(
    () =>
      availableBenefits.find((item) => item.id === activeDefinitionId) ??
      availableBenefits[0],
    [activeDefinitionId]
  );

  const participationLabel = formatParticipationLabel(
    formatted,
    huaralResort.token,
    wallet.isConnected,
    t("connectToSee", { token: huaralResort.token })
  );

  function handleGenerateConfirm() {
    if (!activeDefinition) return;
    const created = generateBenefit(activeDefinition.id);
    if (created) {
      setDialogOpen(false);
      setShowGenerated(true);
    }
  }

  const shouldShowGenerated =
    showGenerated &&
    generatedBenefit &&
    generatedBenefit.benefitDefinitionId === activeDefinition?.id;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-8 sm:py-16">
      <header className="max-w-2xl space-y-3">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {t("label")}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
      </header>

      {shouldShowGenerated && generatedBenefit ? (
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => setShowGenerated(false)}
          >
            <ArrowLeft data-icon="inline-start" />
            {t("backToBenefits")}
          </Button>
          <GeneratedBenefitView benefit={generatedBenefit} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {availableBenefits.map((benefit) => {
            const cardStatus: BenefitStatus =
              generatedBenefit?.benefitDefinitionId === benefit.id
                ? generatedBenefit.status === "redeemed"
                  ? "redeemed"
                  : "generated"
                : "available";

            return (
              <AvailableBenefitCard
                key={benefit.id}
                benefit={benefit}
                status={cardStatus}
                participationLabel={participationLabel}
                onGenerate={() => {
                  setActiveDefinitionId(benefit.id);
                  setDialogOpen(true);
                }}
                onViewGenerated={() => {
                  setActiveDefinitionId(benefit.id);
                  setShowGenerated(true);
                }}
              />
            );
          })}

          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            {t("disclaimer")}
          </p>

          <Link
            href="/benefits/verify"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("verifyLink")}
          </Link>
        </div>
      )}

      {activeDefinition ? (
        <GenerateBenefitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          benefit={activeDefinition}
          onConfirm={handleGenerateConfirm}
        />
      ) : null}
    </div>
  );
}
