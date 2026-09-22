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

  const primaryBenefit = availableBenefits[0];

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 sm:px-8 sm:py-16 lg:py-20">
      {shouldShowGenerated && generatedBenefit ? (
        <div className="flex flex-col gap-6">
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
        <>
          <section className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-14">
            <div className="min-w-0 space-y-3">
              <p className="font-heading text-7xl font-semibold tracking-tighter text-primary tabular-nums sm:text-8xl lg:text-[7.5rem] lg:leading-none">
                {primaryBenefit?.discount ?? 20}
                <span className="text-[0.55em]">%</span>
              </p>
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("heroStatement")}
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                {t("description")}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-4 lg:items-end lg:text-right">
              <p className="text-sm text-muted-foreground">
                {t("yourParticipation", { label: participationLabel })}
              </p>
              {primaryBenefit ? (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setActiveDefinitionId(primaryBenefit.id);
                    setDialogOpen(true);
                  }}
                >
                  {t("generate")}
                </Button>
              ) : null}
            </div>
          </section>

          <div className="flex flex-col gap-6 border-t border-border/70 pt-10">
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

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
              <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                {t("disclaimer")}
              </p>
              <Link
                href="/benefits/verify"
                className="shrink-0 text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t("verifyLink")}
              </Link>
            </div>
          </div>
        </>
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
