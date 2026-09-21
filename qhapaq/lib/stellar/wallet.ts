import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
} from "@stellar/freighter-api";
import {
  isExpectedFreighterNetwork,
  stellarConfig,
} from "./config";

export type FreighterNetworkInfo = {
  network: string;
  networkPassphrase: string;
};

export type ConnectedWallet = {
  address: string;
  network: string;
  networkPassphrase: string;
  isTestnet: boolean;
};

function freighterErrorMessage(
  error: { message?: string } | undefined,
  fallback: string
): string {
  return error?.message?.trim() || fallback;
}

/** Detect whether the Freighter browser extension is available. */
export async function detectFreighter(): Promise<boolean> {
  try {
    const result = await isConnected();
    if (result.error) {
      return false;
    }
    return Boolean(result.isConnected);
  } catch {
    return false;
  }
}

export async function getFreighterNetwork(): Promise<FreighterNetworkInfo> {
  const result = await getNetwork();
  if (result.error) {
    throw new Error(
      freighterErrorMessage(result.error, "Could not read Freighter network.")
    );
  }

  return {
    network: result.network,
    networkPassphrase: result.networkPassphrase,
  };
}

/**
 * Restore a previously authorized Freighter session without prompting.
 * Returns null when Freighter is missing or the app is not yet allowed.
 */
export async function restoreWalletConnection(): Promise<ConnectedWallet | null> {
  const installed = await detectFreighter();
  if (!installed) {
    return null;
  }

  const addressResult = await getAddress();
  if (addressResult.error || !addressResult.address) {
    return null;
  }

  const networkInfo = await getFreighterNetwork();

  return {
    address: addressResult.address,
    network: networkInfo.network,
    networkPassphrase: networkInfo.networkPassphrase,
    isTestnet: isExpectedFreighterNetwork(networkInfo.network),
  };
}

/**
 * Prompt Freighter for access and return the connected public address.
 * Never requests or handles private keys / seed phrases.
 */
export async function connectFreighter(): Promise<ConnectedWallet> {
  const installed = await detectFreighter();
  if (!installed) {
    throw new Error(
      "Freighter is not installed. Install the Freighter browser extension to continue."
    );
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(
      freighterErrorMessage(access.error, "Freighter access was denied.")
    );
  }

  if (!access.address) {
    throw new Error(
      "Freighter did not return a public address. Unlock Freighter and try again."
    );
  }

  const networkInfo = await getFreighterNetwork();

  if (!isExpectedFreighterNetwork(networkInfo.network)) {
    throw new Error(
      `Wrong network. Switch Freighter to ${stellarConfig.displayName} (currently ${networkInfo.network}).`
    );
  }

  if (networkInfo.networkPassphrase !== stellarConfig.networkPassphrase) {
    throw new Error(
      `Freighter network passphrase does not match ${stellarConfig.displayName}.`
    );
  }

  return {
    address: access.address,
    network: networkInfo.network,
    networkPassphrase: networkInfo.networkPassphrase,
    isTestnet: true,
  };
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}
