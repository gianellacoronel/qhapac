import type {
  GeneratedBenefit,
  GeneratedBenefitStatus,
} from "@/lib/benefits/types";
import { isValidBenefitId, normalizeBenefitId } from "@/lib/benefits/utils";

/** Bump when GeneratedBenefit shape changes so stale prototype data resets. */
const STORAGE_KEY_PREFIX = "qhapaq.generated-benefit.v1";

const VALID_STATUSES = new Set<GeneratedBenefitStatus>([
  "generated",
  "verified",
  "redeeming",
  "redeemed",
  "failed",
]);

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function storageKey(walletAddress: string | null | undefined): string {
  const suffix =
    typeof walletAddress === "string" && walletAddress.trim().length > 0
      ? walletAddress.trim()
      : "anonymous";
  return `${STORAGE_KEY_PREFIX}:${suffix}`;
}

function normalizeStoredBenefit(value: unknown): GeneratedBenefit | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<GeneratedBenefit>;
  if (typeof raw.id !== "string" || !isValidBenefitId(raw.id)) return null;
  if (typeof raw.benefitDefinitionId !== "string" || !raw.benefitDefinitionId) {
    return null;
  }
  if (typeof raw.projectId !== "string" || !raw.projectId) return null;
  if (typeof raw.projectName !== "string" || !raw.projectName) return null;
  if (typeof raw.benefitType !== "string" || !raw.benefitType) return null;
  if (typeof raw.validFor !== "string" || !raw.validFor) return null;
  if (typeof raw.discount !== "number" || !Number.isFinite(raw.discount)) {
    return null;
  }
  if (typeof raw.generatedAt !== "string" || !raw.generatedAt) return null;
  if (!raw.status || !VALID_STATUSES.has(raw.status)) return null;

  // In-flight redeem does not survive a reload — allow retry.
  const status: GeneratedBenefitStatus =
    raw.status === "redeeming" ? "verified" : raw.status;

  return {
    id: normalizeBenefitId(raw.id),
    benefitDefinitionId: raw.benefitDefinitionId,
    projectId: raw.projectId,
    projectName: raw.projectName,
    benefitType: raw.benefitType,
    validFor: raw.validFor,
    discount: raw.discount,
    status,
    generatedAt: raw.generatedAt,
    redeemedAt:
      typeof raw.redeemedAt === "string" ? raw.redeemedAt : undefined,
    transactionHash:
      typeof raw.transactionHash === "string" && raw.transactionHash.trim()
        ? raw.transactionHash.trim()
        : undefined,
    explorerUrl:
      typeof raw.explorerUrl === "string" && raw.explorerUrl.trim()
        ? raw.explorerUrl.trim()
        : undefined,
    redeemError:
      typeof raw.redeemError === "string" ? raw.redeemError : undefined,
  };
}

/** Read the prototype-persisted benefit for a wallet (or anonymous). */
export function readStoredGeneratedBenefit(
  walletAddress: string | null | undefined
): GeneratedBenefit | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(walletAddress));
    if (!raw) return null;
    return normalizeStoredBenefit(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** Persist the generated benefit for this wallet across reloads. */
export function writeStoredGeneratedBenefit(
  walletAddress: string | null | undefined,
  benefit: GeneratedBenefit | null
): void {
  if (!canUseStorage()) return;
  try {
    const key = storageKey(walletAddress);
    if (!benefit) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(benefit));
  } catch {
    /* ignore quota / private mode */
  }
}
