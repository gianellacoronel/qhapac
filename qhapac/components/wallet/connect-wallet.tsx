"use client";

import { AlertCircle, Loader2, Unplug, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-wallet";
import { stellarConfig } from "@/lib/stellar/config";
import { shortenAddress } from "@/lib/stellar/wallet";

type ConnectWalletProps = {
  wallet?: ReturnType<typeof useWallet>;
};

export function ConnectWallet({ wallet: walletProp }: ConnectWalletProps) {
  const internalWallet = useWallet();
  const wallet = walletProp ?? internalWallet;

  const {
    address,
    isConnected,
    isTestnet,
    isFreighterAvailable,
    isLoading,
    error,
    connect,
    disconnect,
    clearError,
  } = wallet;

  if (isLoading && !isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-36" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {!isConnected ? (
        <Button
          onClick={() => {
            void connect().catch(() => {
              /* error surfaced via wallet.error */
            });
          }}
          disabled={isLoading || isFreighterAvailable === false}
          size="lg"
        >
          {isLoading ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Wallet data-icon="inline-start" />
          )}
          Connect Wallet
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            <Wallet data-icon="inline-start" />
            {shortenAddress(address!)}
          </Badge>
          <Badge variant={isTestnet ? "outline" : "destructive"}>
            {isTestnet ? stellarConfig.displayName : "Wrong network"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
            aria-label="Disconnect wallet"
          >
            <Unplug data-icon="inline-start" />
            Disconnect
          </Button>
        </div>
      )}

      {isFreighterAvailable === false ? (
        <Alert>
          <AlertCircle />
          <AlertTitle>Freighter required</AlertTitle>
          <AlertDescription>
            Install the Freighter browser extension and refresh this page to
            connect your Stellar Testnet wallet.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Wallet error</AlertTitle>
          <AlertDescription>
            <span className="block">{error}</span>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
