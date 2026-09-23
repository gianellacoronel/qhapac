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
import { useLocalizedProject } from "@/hooks/use-localized-project";
import { useQrpBalance } from "@/hooks/use-qrp-balance";
import { useWallet } from "@/hooks/use-wallet";
import { availableBenefits } from "@/lib/benefits/data";
import type { BenefitStatus } from "@/lib/benefits/types";

/** Maps project benefit ids to generatable benefit definition ids. */
const PROJECT_TO_DEFINITION: Record<string, string> = {
  discount: "huaral-resort-20-off",
};

export function BenefitsPage() {
  const t = useTranslations("benefits");
  const project = useLocalizedProject();
  const wallet = useWallet();
  const { generatedBenefit, generateBenefit } = useBenefitSession();
  const { formatted, isLoading: balanceLoading } = useQrpBalance(
    wallet.isConnected && wallet.isTestnet ? wallet.address : null,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeDefinitionId, setActiveDefinitionId] = useState(
    availableBenefits[0]?.id ?? "",
  );
  const [showGenerated, setShowGenerated] = useState(
    () => generatedBenefit != null,
  );

  const activeDefinition = useMemo(
    () =>
      availableBenefits.find((item) => item.id === activeDefinitionId) ??
      availableBenefits[0],
    [activeDefinitionId],
  );

  const participationLabel = formatParticipationLabel(
    formatted,
    project.token,
    wallet.isConnected,
    t("connectToSee", { token: project.token }),
    balanceLoading,
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-8 sm:py-16 lg:py-14">
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
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {t.rich("title", {
                mark: (chunks) => (
                  <span className="bg-primary px-1.5 py-0.5 text-primary-foreground">
                    {chunks}
                  </span>
                ),
              })}
            </h1>
            <p className="shrink-0 text-sm text-muted-foreground sm:text-right">
              {t("yourParticipation", { label: participationLabel })}
            </p>
          </header>

          <div className="flex flex-col gap-0">
            {project.benefits.map((benefit) => {
              const definitionId = PROJECT_TO_DEFINITION[benefit.id];
              const definition = definitionId
                ? availableBenefits.find((item) => item.id === definitionId)
                : undefined;

              if (definition) {
                const cardStatus: BenefitStatus =
                  generatedBenefit?.benefitDefinitionId === definition.id
                    ? generatedBenefit.status === "redeemed"
                      ? "redeemed"
                      : "generated"
                    : "available";

                return (
                  <AvailableBenefitCard
                    key={benefit.id}
                    benefit={definition}
                    projectBenefit={benefit}
                    status={cardStatus}
                    onGenerate={() => {
                      setActiveDefinitionId(definition.id);
                      setDialogOpen(true);
                    }}
                    onViewGenerated={() => {
                      setActiveDefinitionId(definition.id);
                      setShowGenerated(true);
                    }}
                  />
                );
              }

              return (
                <AvailableBenefitCard
                  key={benefit.id}
                  projectBenefit={benefit}
                />
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
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
