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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-8 sm:py-16">
      <header className="max-w-2xl space-y-3">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {t("label")}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("description", {
            token: huaralResort.token,
            projectName: huaralResort.name,
            value: huaralResort.referenceValueUsd,
          })}
        </p>
      </header>

      <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-start">
        <ParticipationCard
          address={wallet.address}
          isConnected={wallet.isConnected}
          isTestnet={wallet.isTestnet}
        />
        <TestTransactionCard
          address={wallet.address}
          isConnected={wallet.isConnected}
          isTestnet={wallet.isTestnet}
        />
      </div>
    </div>
  );
}
