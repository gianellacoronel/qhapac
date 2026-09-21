"use client";

import { useCallback, useEffect, useState } from "react";
import { WatchWalletChanges } from "@stellar/freighter-api";
import {
  isExpectedFreighterNetwork,
  stellarConfig,
} from "@/lib/stellar/config";
import {
  connectFreighter,
  detectFreighter,
  restoreWalletConnection,
  type ConnectedWallet,
} from "@/lib/stellar/wallet";

export type WalletState = {
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
  isConnected: boolean;
  isTestnet: boolean;
  isFreighterAvailable: boolean | null;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected wallet error.";
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(
    null
  );
  const [isFreighterAvailable, setIsFreighterAvailable] = useState<
    boolean | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyWallet = useCallback((wallet: ConnectedWallet | null) => {
    if (!wallet) {
      setAddress(null);
      setNetwork(null);
      setNetworkPassphrase(null);
      return;
    }

    setAddress(wallet.address);
    setNetwork(wallet.network);
    setNetworkPassphrase(wallet.networkPassphrase);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      try {
        const available = await detectFreighter();
        if (cancelled) return;
        setIsFreighterAvailable(available);

        if (!available) {
          applyWallet(null);
          return;
        }

        const restored = await restoreWalletConnection();
        if (cancelled) return;

        if (restored && !restored.isTestnet) {
          setError(
            `Wrong network. Switch Freighter to ${stellarConfig.displayName}.`
          );
          applyWallet(restored);
          return;
        }

        applyWallet(restored);
      } catch (err) {
        if (!cancelled) {
          setError(toErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [applyWallet]);

  useEffect(() => {
    if (!address) {
      return;
    }

    const watcher = new WatchWalletChanges(1000);
    watcher.watch((change) => {
      if (change.error) {
        return;
      }

      setAddress(change.address || null);
      setNetwork(change.network || null);
      setNetworkPassphrase(change.networkPassphrase || null);

      if (
        change.network &&
        !isExpectedFreighterNetwork(change.network)
      ) {
        setError(
          `Wrong network. Switch Freighter to ${stellarConfig.displayName}.`
        );
      } else if (
        change.network &&
        isExpectedFreighterNetwork(change.network)
      ) {
        setError(null);
      }
    });

    return () => {
      watcher.stop();
    };
  }, [address]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const wallet = await connectFreighter();
      applyWallet(wallet);
      setIsFreighterAvailable(true);
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [applyWallet]);

  const disconnect = useCallback(() => {
    applyWallet(null);
    setError(null);
  }, [applyWallet]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isConnected = Boolean(address);
  const isTestnet = network
    ? isExpectedFreighterNetwork(network)
    : false;

  return {
    address,
    network,
    networkPassphrase,
    isConnected,
    isTestnet,
    isFreighterAvailable,
    isLoading,
    error,
    connect,
    disconnect,
    clearError,
  };
}
