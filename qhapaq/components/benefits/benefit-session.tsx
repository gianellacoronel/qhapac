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
import { getBenefitDefinition } from "@/lib/benefits/data";
import {
  readStoredGeneratedBenefit,
  writeStoredGeneratedBenefit,
} from "@/lib/benefits/session-store";
import type { GeneratedBenefit } from "@/lib/benefits/types";
import {
  createBenefitId,
  normalizeBenefitId,
} from "@/lib/benefits/utils";
import { useWallet } from "@/hooks/use-wallet";

export type RedeemBenefitOutcome =
  | { ok: true; benefit: GeneratedBenefit }
  | { ok: false; benefit: GeneratedBenefit; errorCode: string; message: string };

type BenefitSessionContextValue = {
  generatedBenefit: GeneratedBenefit | null;
  /** False until localStorage has been read for the current wallet. */
  isHydrated: boolean;
  generateBenefit: (definitionId: string) => GeneratedBenefit | null;
  verifyBenefit: (benefitId: string) => GeneratedBenefit | null;
  markVerified: (benefitId: string) => GeneratedBenefit | null;
  redeemBenefit: (benefitId: string) => Promise<RedeemBenefitOutcome>;
  clearSession: () => void;
};

type RedeemApiSuccess = {
  success: true;
  benefitId: string;
  transactionHash: string;
  explorerUrl: string;
};

type RedeemApiFailure = {
  success: false;
  error?: string;
  message?: string;
};

const BenefitSessionContext = createContext<BenefitSessionContextValue | null>(
  null
);

export function BenefitSessionProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const [generatedBenefit, setGeneratedBenefit] =
    useState<GeneratedBenefit | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sessionAddress, setSessionAddress] = useState<
    string | null | undefined
  >(undefined);

  // Clear immediately when the wallet slot changes so we never mutate another
  // wallet's benefit before localStorage hydrates.
  if (sessionAddress !== address) {
    setSessionAddress(address);
    setGeneratedBenefit(null);
    setIsHydrated(false);
  }

  useEffect(() => {
    setGeneratedBenefit(readStoredGeneratedBenefit(address));
    setIsHydrated(true);
  }, [address]);

  const persistBenefit = useCallback(
    (benefit: GeneratedBenefit | null) => {
      setGeneratedBenefit(benefit);
      writeStoredGeneratedBenefit(address, benefit);
    },
    [address]
  );

  const generateBenefit = useCallback(
    (definitionId: string) => {
      if (!isHydrated) return null;

      // Prototype: one generation per wallet — never mint a second ID.
      if (generatedBenefit) {
        return generatedBenefit.benefitDefinitionId === definitionId
          ? generatedBenefit
          : null;
      }

      const definition = getBenefitDefinition(definitionId);
      if (!definition) return null;

      const next: GeneratedBenefit = {
        id: createBenefitId(),
        benefitDefinitionId: definition.id,
        projectId: definition.projectId,
        projectName: definition.projectName,
        benefitType: definition.title,
        validFor: definition.validFor,
        discount: definition.discount,
        status: "generated",
        generatedAt: new Date().toISOString(),
      };

      persistBenefit(next);
      return next;
    },
    [generatedBenefit, isHydrated, persistBenefit]
  );

  const verifyBenefit = useCallback(
    (benefitId: string) => {
      if (!generatedBenefit) return null;
      if (
        normalizeBenefitId(generatedBenefit.id) !==
        normalizeBenefitId(benefitId)
      ) {
        return null;
      }
      return generatedBenefit;
    },
    [generatedBenefit]
  );

  const markVerified = useCallback(
    (benefitId: string) => {
      if (!generatedBenefit) return null;
      if (
        normalizeBenefitId(generatedBenefit.id) !==
        normalizeBenefitId(benefitId)
      ) {
        return null;
      }
      if (
        generatedBenefit.status === "redeemed" ||
        generatedBenefit.status === "redeeming"
      ) {
        return generatedBenefit;
      }

      const verified: GeneratedBenefit = {
        ...generatedBenefit,
        status: "verified",
        redeemError: undefined,
      };
      persistBenefit(verified);
      return verified;
    },
    [generatedBenefit, persistBenefit]
  );

  const redeemBenefit = useCallback(
    async (benefitId: string): Promise<RedeemBenefitOutcome> => {
      const normalized = normalizeBenefitId(benefitId);
      const current = generatedBenefit;

      if (!current || normalizeBenefitId(current.id) !== normalized) {
        const fallback: GeneratedBenefit = {
          id: normalized || "UNKNOWN",
          benefitDefinitionId: "",
          projectId: "",
          projectName: "",
          benefitType: "",
          validFor: "",
          discount: 0,
          status: "failed",
          generatedAt: new Date().toISOString(),
          redeemError: "not_found",
        };
        return {
          ok: false,
          benefit: fallback,
          errorCode: "not_found",
          message: "This benefit could not be verified.",
        };
      }

      if (current.status === "redeemed") {
        return {
          ok: false,
          benefit: current,
          errorCode: "already_redeemed",
          message: "This benefit has already been redeemed.",
        };
      }

      if (current.status === "redeeming") {
        return {
          ok: false,
          benefit: current,
          errorCode: "in_progress",
          message: "Redemption is already in progress.",
        };
      }

      const redeeming: GeneratedBenefit = {
        ...current,
        status: "redeeming",
        redeemError: undefined,
      };
      persistBenefit(redeeming);

      try {
        const response = await fetch("/api/benefits/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ benefitId: current.id }),
        });

        const payload = (await response.json()) as
          | RedeemApiSuccess
          | RedeemApiFailure;

        if (!response.ok || !payload.success) {
          const failure = payload as RedeemApiFailure;
          const errorCode =
            failure.error === "already_redeemed"
              ? "already_redeemed"
              : failure.error === "invalid_benefit"
                ? "not_found"
                : failure.error === "not_configured"
                  ? "not_configured"
                  : "submit_failed";
          const message =
            failure.message?.trim() ||
            (errorCode === "already_redeemed"
              ? "This benefit has already been redeemed."
              : errorCode === "not_found"
                ? "This benefit could not be verified."
                : "We couldn't record the redemption on Stellar. Please try again.");

          const failed: GeneratedBenefit = {
            ...current,
            status: "failed",
            redeemError: errorCode,
          };
          persistBenefit(failed);
          return { ok: false, benefit: failed, errorCode, message };
        }

        const success = payload as RedeemApiSuccess;
        const redeemed: GeneratedBenefit = {
          ...current,
          status: "redeemed",
          redeemedAt: new Date().toISOString(),
          transactionHash: success.transactionHash,
          explorerUrl: success.explorerUrl,
          redeemError: undefined,
        };
        persistBenefit(redeemed);
        return { ok: true, benefit: redeemed };
      } catch {
        const errorCode = "submit_failed";
        const message =
          "We couldn't record the redemption on Stellar. Please try again.";
        const failed: GeneratedBenefit = {
          ...current,
          status: "failed",
          redeemError: errorCode,
        };
        persistBenefit(failed);
        return { ok: false, benefit: failed, errorCode, message };
      }
    },
    [generatedBenefit, persistBenefit]
  );

  const clearSession = useCallback(() => {
    persistBenefit(null);
  }, [persistBenefit]);

  const value = useMemo(
    () => ({
      generatedBenefit,
      isHydrated,
      generateBenefit,
      verifyBenefit,
      markVerified,
      redeemBenefit,
      clearSession,
    }),
    [
      generatedBenefit,
      isHydrated,
      generateBenefit,
      verifyBenefit,
      markVerified,
      redeemBenefit,
      clearSession,
    ]
  );

  return (
    <BenefitSessionContext.Provider value={value}>
      {children}
    </BenefitSessionContext.Provider>
  );
}

export function useBenefitSession(): BenefitSessionContextValue {
  const context = useContext(BenefitSessionContext);
  if (!context) {
    throw new Error(
      "useBenefitSession must be used within a BenefitSessionProvider"
    );
  }
  return context;
}
