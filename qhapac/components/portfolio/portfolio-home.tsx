"use client";

import { ConnectWallet } from "@/components/wallet/connect-wallet";
import { ParticipationCard } from "@/components/portfolio/participation-card";
import { useWallet } from "@/hooks/use-wallet";

export function PortfolioHome() {
  const wallet = useWallet();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 sm:px-10 sm:py-16">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Qhapaq
          </p>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Real-world asset participation on Stellar Testnet. Connect Freighter
            to view your QRP balance for Huaral Resort.
          </p>
        </div>
        <ConnectWallet wallet={wallet} />
      </header>

      <ParticipationCard
        address={wallet.address}
        isConnected={wallet.isConnected}
        isTestnet={wallet.isTestnet}
      />
    </div>
  );
}
