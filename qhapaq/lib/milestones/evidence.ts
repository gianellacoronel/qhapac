import { createHash } from "node:crypto";
import type { MilestoneEvidence } from "./types";
import {
  HUARAL_MILESTONE_IDS,
  type HuaralMilestoneId,
} from "./data";

export const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_EVIDENCE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedEvidenceMimeType =
  (typeof ALLOWED_EVIDENCE_MIME_TYPES)[number];

const MIME_BY_EXTENSION: Record<string, AllowedEvidenceMimeType> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Short on-chain / Pinata reference codes (fits Stellar Memo.text if needed). */
export const MILESTONE_SHORT_CODES: Record<HuaralMilestoneId, string> = {
  "land-acquisition": "QHP-MS-01",
  "construction-start": "QHP-MS-02",
  "construction-25": "QHP-MS-03",
  "construction-50": "QHP-MS-04",
  "project-complete": "QHP-MS-05",
};

export const PINATA_PLATFORM = "Qhapaq";
export const PINATA_PROJECT = "Huaral Resort";

export type EvidenceValidationError =
  | "missing_file"
  | "invalid_type"
  | "too_large"
  | "invalid_description"
  | "invalid_milestone";

export function isHuaralMilestoneId(id: string): id is HuaralMilestoneId {
  return (HUARAL_MILESTONE_IDS as readonly string[]).includes(id);
}

export function getMilestoneShortCode(milestoneId: string): string | null {
  if (!isHuaralMilestoneId(milestoneId)) return null;
  return MILESTONE_SHORT_CODES[milestoneId];
}

export function milestoneIdFromShortCode(code: string): HuaralMilestoneId | null {
  const normalized = code.trim().toUpperCase();
  for (const id of HUARAL_MILESTONE_IDS) {
    if (MILESTONE_SHORT_CODES[id] === normalized) return id;
  }
  return null;
}

function extensionOf(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) return "";
  return fileName.slice(idx).toLowerCase();
}

export function resolveEvidenceMimeType(
  fileName: string,
  declaredType: string
): AllowedEvidenceMimeType | null {
  const declared = declaredType.trim().toLowerCase();
  if (
    (ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(declared)
  ) {
    return declared as AllowedEvidenceMimeType;
  }

  // Some browsers send empty type for PDFs — allow extension fallback only.
  const fromExt = MIME_BY_EXTENSION[extensionOf(fileName)];
  return fromExt ?? null;
}

export function validateEvidenceDescription(
  raw: unknown
): { ok: true; description: string } | { ok: false; error: "invalid_description" } {
  if (typeof raw !== "string") {
    return { ok: false, error: "invalid_description" };
  }
  const description = raw.trim();
  if (!description || description.length > 2000) {
    return { ok: false, error: "invalid_description" };
  }
  return { ok: true, description };
}

export function validateEvidenceFile(
  file: File | null | undefined
):
  | {
      ok: true;
      file: File;
      fileType: AllowedEvidenceMimeType;
    }
  | { ok: false; error: EvidenceValidationError } {
  if (!file || !(file instanceof File) || file.size <= 0) {
    return { ok: false, error: "missing_file" };
  }

  if (file.size > EVIDENCE_MAX_BYTES) {
    return { ok: false, error: "too_large" };
  }

  const fileType = resolveEvidenceMimeType(file.name, file.type);
  if (!fileType) {
    return { ok: false, error: "invalid_type" };
  }

  return { ok: true, file, fileType };
}

export function sha256Hex(bytes: ArrayBuffer | Uint8Array | Buffer): string {
  const buf = Buffer.isBuffer(bytes)
    ? bytes
    : Buffer.from(
        bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes
      );
  return createHash("sha256").update(buf).digest("hex");
}

export function sha256BytesFromHex(hex: string): Buffer {
  const normalized = hex.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error("Invalid SHA-256 hex string.");
  }
  return Buffer.from(normalized, "hex");
}

export function isMilestoneEvidence(
  value: unknown
): value is MilestoneEvidence {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.description === "string" &&
    typeof e.fileName === "string" &&
    typeof e.fileType === "string" &&
    typeof e.cid === "string" &&
    typeof e.gatewayUrl === "string" &&
    typeof e.contentHash === "string" &&
    e.contentHash.length === 64
  );
}

/** Truncate for Pinata keyvalues (keep searchable, avoid huge metadata). */
export function truncateForPinataMetadata(
  value: string,
  max = 180
): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1))}…`;
}

export function formatFileSize(bytes: number, locale: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toLocaleString(locale, { maximumFractionDigits: 1 })} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toLocaleString(locale, { maximumFractionDigits: 2 })} MB`;
}
