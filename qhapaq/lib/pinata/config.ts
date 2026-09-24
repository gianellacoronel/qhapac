/**
 * Server-only Pinata SDK client. Never import from client components.
 * Uses PINATA_JWT only — never expose via NEXT_PUBLIC_*.
 *
 * PINATA_JWT must be the long JWT from Pinata → API Keys (starts with `eyJ`,
 * three dot-separated segments). The short `pinata_api_key` / secret values
 * are NOT valid here and will cause 401 uploads.
 */
import { PinataSDK } from "pinata";

export class PinataConfigError extends Error {
  readonly code = "PINATA_CONFIG" as const;

  constructor(message: string) {
    super(message);
    this.name = "PinataConfigError";
  }
}

/** True when value looks like a JWT (header.payload.signature). */
export function isLikelyPinataJwt(value: string): boolean {
  const jwt = value.trim();
  if (!jwt || jwt.length < 40) return false;
  const parts = jwt.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
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

  if (!isLikelyPinataJwt(jwt)) {
    throw new PinataConfigError(
      "PINATA_JWT is not a valid JWT. Use the long JWT from Pinata API Keys (not the short API key)."
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
