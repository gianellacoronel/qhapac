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
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start lg:gap-x-12 lg:gap-y-10">
        <header className="space-y-3">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {t("label")}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {t("description", {
              token: huaralResort.token,
              projectName: huaralResort.name,
              value: huaralResort.referenceValueUsd,
            })}
          </p>
        </header>

        <div className="min-w-0 lg:row-span-2">
          <ParticipationCard
            address={wallet.address}
            isConnected={wallet.isConnected}
            isTestnet={wallet.isTestnet}
          />
        </div>

        <TestTransactionCard
          address={wallet.address}
          isConnected={wallet.isConnected}
          isTestnet={wallet.isTestnet}
        />
      </div>
    </div>
  );
}
