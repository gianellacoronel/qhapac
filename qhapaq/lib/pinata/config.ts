/**
 * Server-only Pinata SDK client. Never import from client components.
 * Uses PINATA_JWT only — never expose via NEXT_PUBLIC_*.
 */
import { PinataSDK } from "pinata";

export class PinataConfigError extends Error {
  readonly code = "PINATA_CONFIG" as const;

  constructor(message: string) {
    super(message);
    this.name = "PinataConfigError";
  }
}

/** Gateway host only (e.g. `abc123.mypinata.cloud`), no protocol or path. */
export function getPinataGatewayHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim();
  if (!raw) return null;

  try {
    if (raw.includes("://")) {
      return new URL(raw).host || null;
    }
  } catch {
    // Fall through to host-like parsing.
  }

  return raw.replace(/^\/+|\/+$/g, "") || null;
}

export function buildIpfsGatewayUrl(cid: string): string | null {
  const host = getPinataGatewayHost();
  if (!host || !cid.trim()) return null;
  return `https://${host}/ipfs/${cid.trim()}`;
}

let cached: PinataSDK | null = null;

export function getPinataClient(): PinataSDK {
  const jwt = process.env.PINATA_JWT?.trim();
  if (!jwt) {
    throw new PinataConfigError(
      "Missing PINATA_JWT server environment variable."
    );
  }

  if (cached) return cached;

  const gateway = getPinataGatewayHost() ?? undefined;
  cached = new PinataSDK({
    pinataJwt: jwt,
    ...(gateway ? { pinataGateway: gateway } : {}),
  });
  return cached;
}
