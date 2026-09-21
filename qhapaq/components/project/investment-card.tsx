"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      <Card className="w-full shadow-xs">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardDescription>{t("yourParticipation")}</CardDescription>
              <CardTitle className="font-heading text-xl">
                {project.name}
              </CardTitle>
            </div>
            <Badge variant="outline">{project.token}</Badge>
          </div>
        </CardHeader>

        <CardContent className="gap-5">
          <Separator />

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t("balance")}</p>
            {!isConnected ? (
              <p className="font-heading text-3xl font-semibold tracking-tight text-muted-foreground">
                {t("connectWallet")}
              </p>
            ) : !isTestnet ? (
              <p className="font-heading text-3xl font-semibold tracking-tight text-destructive">
                {t("switchToTestnet")}
              </p>
            ) : isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : error ? (
              <p className="font-heading text-3xl font-semibold tracking-tight text-destructive">
                —
              </p>
            ) : (
              <>
                <p className="font-heading text-3xl font-semibold tracking-tight">
                  {formatted ?? "0"}{" "}
                  <span className="text-lg font-normal text-muted-foreground">
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

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t("benefits")}</p>
            <p className="flex items-center gap-2 font-medium">
              <Gift className="size-4 text-primary" aria-hidden />
              {project.mainBenefit}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Link href="/benefits" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              {t("viewBenefits")}
            </Button>
          </Link>
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            {t("participate")}
          </Button>
        </CardFooter>
      </Card>

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
      />
    </>
  );
}
