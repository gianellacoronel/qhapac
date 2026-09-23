"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { WatchWalletChanges } from "@stellar/freighter-api";
import {
  isExpectedFreighterNetwork,
  stellarConfig,
} from "@/lib/stellar/config";
import {
  connectFreighter,
  detectFreighter,
  getWalletConnectionPreference,
  restoreWalletConnection,
  setWalletConnectionPreference,
  type ConnectedWallet,
} from "@/lib/stellar/wallet";

export type WalletErrorCode = "wrong_network" | "unexpected" | "raw" | null;

export type WalletState = {
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
  isConnected: boolean;
  isTestnet: boolean;
  isFreighterAvailable: boolean | null;
  isLoading: boolean;
  error: string | null;
  errorCode: WalletErrorCode;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
};

const WalletContext = createContext<WalletState | null>(null);

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected wallet error.";
}

function useWalletState(): WalletState {
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
  const [errorCode, setErrorCode] = useState<WalletErrorCode>(null);

  const setWalletError = useCallback(
    (code: WalletErrorCode, message: string | null) => {
      setErrorCode(code);
      setError(message);
    },
    []
  );

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

        const preference = getWalletConnectionPreference();
        // Only restore when the user previously connected explicitly.
        // Freighter available / previously authorized ≠ auto-connect.
        if (preference !== "connected") {
          applyWallet(null);
          return;
        }

        const restored = await restoreWalletConnection();
        if (cancelled) return;

        if (!restored) {
          applyWallet(null);
          return;
        }

        if (!restored.isTestnet) {
          setWalletError(
            "wrong_network",
            `Wrong network. Switch Freighter to ${stellarConfig.displayName}.`
          );
          applyWallet(restored);
          return;
        }

        applyWallet(restored);
      } catch (err) {
        if (!cancelled) {
          setWalletError("raw", toErrorMessage(err));
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
  }, [applyWallet, setWalletError]);

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
        setWalletError(
          "wrong_network",
          `Wrong network. Switch Freighter to ${stellarConfig.displayName}.`
        );
      } else if (
        change.network &&
        isExpectedFreighterNetwork(change.network)
      ) {
        setWalletError(null, null);
      }
    });

    return () => {
      watcher.stop();
    };
  }, [address, setWalletError]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setWalletError(null, null);

    try {
      const wallet = await connectFreighter();
      setWalletConnectionPreference("connected");
      applyWallet(wallet);
      setIsFreighterAvailable(true);
    } catch (err) {
      setWalletError("raw", toErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [applyWallet, setWalletError]);

  const disconnect = useCallback(() => {
    setWalletConnectionPreference("disconnected");
    applyWallet(null);
    setWalletError(null, null);
  }, [applyWallet, setWalletError]);

  const clearError = useCallback(() => {
    setWalletError(null, null);
  }, [setWalletError]);

  const isConnected = Boolean(address);
  const isTestnet = network
    ? isExpectedFreighterNetwork(network)
    : false;

  return useMemo(
    () => ({
      address,
      network,
      networkPassphrase,
      isConnected,
      isTestnet,
      isFreighterAvailable,
      isLoading,
      error,
      errorCode,
      connect,
      disconnect,
      clearError,
    }),
    [
      address,
      network,
      networkPassphrase,
      isConnected,
      isTestnet,
      isFreighterAvailable,
      isLoading,
      error,
      errorCode,
      connect,
      disconnect,
      clearError,
    ]
  );
}

/** Single shared Freighter connection for the whole app. */
export function WalletProvider({ children }: { children: ReactNode }) {
  const value = useWalletState();
  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
