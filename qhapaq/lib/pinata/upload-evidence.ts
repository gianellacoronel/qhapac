/**
 * Server-only Pinata evidence upload for milestone approvals.
 */
import {
  PINATA_PLATFORM,
  PINATA_PROJECT,
  getMilestoneShortCode,
  truncateForPinataMetadata,
  type AllowedEvidenceMimeType,
} from "@/lib/milestones/evidence";
import {
  PinataConfigError,
  buildIpfsGatewayUrl,
  getPinataClient,
} from "./config";

export class PinataUploadError extends Error {
  readonly code = "PINATA_UPLOAD" as const;

  constructor(message: string) {
    super(message);
    this.name = "PinataUploadError";
  }
}

export type UploadedEvidence = {
  cid: string;
  gatewayUrl: string;
  fileName: string;
  fileType: AllowedEvidenceMimeType;
  contentHash: string;
  description: string;
  shortCode: string;
};

export async function uploadMilestoneEvidenceToPinata(input: {
  file: File;
  fileType: AllowedEvidenceMimeType;
  milestoneId: string;
  description: string;
  contentHash: string;
}): Promise<UploadedEvidence> {
  const shortCode = getMilestoneShortCode(input.milestoneId);
  if (!shortCode) {
    throw new PinataUploadError("Unknown milestone for evidence upload.");
  }

  const gatewayUrl = buildIpfsGatewayUrl("placeholder");
  if (!gatewayUrl) {
    throw new PinataConfigError(
      "Missing NEXT_PUBLIC_GATEWAY_URL. Set your Pinata gateway host (e.g. xyz.mypinata.cloud)."
    );
  }

  let pinata;
  try {
    pinata = getPinataClient();
  } catch (error) {
    if (error instanceof PinataConfigError) throw error;
    throw new PinataConfigError("Pinata is not configured.");
  }

  const fileName = input.file.name.trim() || `evidence-${shortCode}`;

  try {
    const upload = await pinata.upload.public
      .file(input.file)
      .name(fileName)
      .keyvalues({
        platform: PINATA_PLATFORM,
        project: PINATA_PROJECT,
        milestoneId: input.milestoneId,
        shortCode,
        description: truncateForPinataMetadata(input.description),
        fileName: truncateForPinataMetadata(fileName, 120),
        fileType: input.fileType,
        contentHash: input.contentHash,
      });

    const cid = upload.cid?.trim();
    if (!cid) {
      throw new PinataUploadError("Pinata did not return a CID.");
    }

    const resolvedGateway = buildIpfsGatewayUrl(cid);
    if (!resolvedGateway) {
      throw new PinataConfigError(
        "Missing NEXT_PUBLIC_GATEWAY_URL for IPFS gateway URLs."
      );
    }

    return {
      cid,
      gatewayUrl: resolvedGateway,
      fileName,
      fileType: input.fileType,
      contentHash: input.contentHash,
      description: input.description,
      shortCode,
    };
  } catch (error: unknown) {
    if (
      error instanceof PinataConfigError ||
      error instanceof PinataUploadError
    ) {
      throw error;
    }
    throw new PinataUploadError(
      "Could not upload evidence to Pinata/IPFS."
    );
  }
}

export async function listQhapaqEvidenceFromPinata(): Promise<
  Array<{
    milestoneId: string;
    cid: string;
    gatewayUrl: string;
    fileName: string;
    fileType: string;
    contentHash: string;
    description: string;
    shortCode: string;
    createdAt?: string;
  }>
> {
  const gatewayConfigured = Boolean(buildIpfsGatewayUrl("x"));
  if (!gatewayConfigured) return [];

  let pinata;
  try {
    pinata = getPinataClient();
  } catch {
    return [];
  }

  try {
    const files = await pinata.files.public
      .list()
      .keyvalues({ platform: PINATA_PLATFORM })
      .limit(50);

    const items = Array.isArray(files?.files) ? files.files : [];
    const results: Array<{
      milestoneId: string;
      cid: string;
      gatewayUrl: string;
      fileName: string;
      fileType: string;
      contentHash: string;
      description: string;
      shortCode: string;
      createdAt?: string;
    }> = [];

    for (const file of items) {
      const kv = file.keyvalues ?? {};
      const milestoneId =
        typeof kv.milestoneId === "string" ? kv.milestoneId.trim() : "";
      const contentHash =
        typeof kv.contentHash === "string"
          ? kv.contentHash.trim().toLowerCase()
          : "";
      const cid = typeof file.cid === "string" ? file.cid.trim() : "";
      if (!milestoneId || !contentHash || !cid || cid === "pending") continue;

      const gatewayUrl = buildIpfsGatewayUrl(cid);
      if (!gatewayUrl) continue;

      results.push({
        milestoneId,
        cid,
        gatewayUrl,
        fileName:
          (typeof kv.fileName === "string" && kv.fileName.trim()) ||
          file.name ||
          "evidence",
        fileType:
          (typeof kv.fileType === "string" && kv.fileType.trim()) ||
          file.mime_type ||
          "application/octet-stream",
        contentHash,
        description:
          typeof kv.description === "string" ? kv.description : "",
        shortCode:
          typeof kv.shortCode === "string" ? kv.shortCode : "",
        createdAt: file.created_at,
      });
    }

    return results;
  } catch {
    return [];
  }
}
