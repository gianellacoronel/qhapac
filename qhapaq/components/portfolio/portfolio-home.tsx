"use client";

import { useTranslations } from "next-intl";
import { ParticipationCard } from "@/components/portfolio/participation-card";
import { TestTransactionCard } from "@/components/wallet/test-transaction-card";
import { useWallet } from "@/hooks/use-wallet";
import { huaralResort } from "@/lib/project/data";

export function PortfolioHome() {
  const t = useTranslations("portfolio");
  const wallet = useWallet();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-12 sm:px-8 sm:py-16 lg:py-20">
      <header className="max-w-xl space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("description", {
            token: huaralResort.token,
            projectName: huaralResort.name,
            value: huaralResort.referenceValueUsd,
          })}
        </p>
      </header>

      <ParticipationCard
        address={wallet.address}
        isConnected={wallet.isConnected}
        isTestnet={wallet.isTestnet}
      />

      <div className="border-t border-border/70 pt-10 opacity-90">
        <TestTransactionCard
          address={wallet.address}
          isConnected={wallet.isConnected}
          isTestnet={wallet.isTestnet}
        />
      </div>
    </div>
  );
}
