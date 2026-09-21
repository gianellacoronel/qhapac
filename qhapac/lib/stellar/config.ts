import { Horizon, Networks } from "stellar-sdk";

export type StellarNetworkName = "testnet" | "public";

export type StellarConfig = {
  network: StellarNetworkName;
  freighterNetwork: "TESTNET" | "PUBLIC";
  networkPassphrase: string;
  horizonUrl: string;
  explorerBaseUrl: string;
  displayName: string;
};

const NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet").toLowerCase();

function resolveConfig(network: string): StellarConfig {
  switch (network) {
    case "testnet":
      return {
        network: "testnet",
        freighterNetwork: "TESTNET",
        networkPassphrase: Networks.TESTNET,
        horizonUrl: "https://horizon-testnet.stellar.org",
        explorerBaseUrl: "https://stellar.expert/explorer/testnet",
        displayName: "Stellar Testnet",
      };
    case "public":
    case "mainnet":
      return {
        network: "public",
        freighterNetwork: "PUBLIC",
        networkPassphrase: Networks.PUBLIC,
        horizonUrl: "https://horizon.stellar.org",
        explorerBaseUrl: "https://stellar.expert/explorer/public",
        displayName: "Stellar Mainnet",
      };
    default:
      throw new Error(
        `Unsupported NEXT_PUBLIC_STELLAR_NETWORK "${network}". Use "testnet".`
      );
  }
}

export const stellarConfig: StellarConfig = resolveConfig(NETWORK);

/** Horizon client for classic account/balance queries and tx submission. */
export function getHorizonServer(): Horizon.Server {
  return new Horizon.Server(stellarConfig.horizonUrl);
}

export function requireQrpIssuer(): string {
  const issuer = process.env.NEXT_PUBLIC_QRP_ISSUER?.trim();
  if (!issuer) {
    throw new Error("Missing NEXT_PUBLIC_QRP_ISSUER environment variable.");
  }
  return issuer;
}

export function isExpectedFreighterNetwork(network: string): boolean {
  return network.toUpperCase() === stellarConfig.freighterNetwork;
}
