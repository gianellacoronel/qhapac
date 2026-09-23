"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getBenefitDefinition } from "@/lib/benefits/data";
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
  const previousAddressRef = useRef<string | null | undefined>(undefined);
  const [generatedBenefit, setGeneratedBenefit] =
    useState<GeneratedBenefit | null>(null);

  // Drop session data when the connected wallet changes or disconnects.
  useEffect(() => {
    const previous = previousAddressRef.current;
    previousAddressRef.current = address;

    if (previous === undefined) {
      return;
    }

    if (previous !== address) {
      setGeneratedBenefit(null);
    }
  }, [address]);

  const generateBenefit = useCallback((definitionId: string) => {
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

    setGeneratedBenefit(next);
    return next;
  }, []);

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

  const markVerified = useCallback((benefitId: string) => {
    let verified: GeneratedBenefit | null = null;

    setGeneratedBenefit((current) => {
      if (!current) return current;
      if (normalizeBenefitId(current.id) !== normalizeBenefitId(benefitId)) {
        return current;
      }
      if (current.status === "redeemed" || current.status === "redeeming") {
        verified = current;
        return current;
      }

      verified = {
        ...current,
        status: "verified",
        redeemError: undefined,
      };
      return verified;
    });

    return verified;
  }, []);

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
      setGeneratedBenefit(redeeming);

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
          setGeneratedBenefit(failed);
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
        setGeneratedBenefit(redeemed);
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
        setGeneratedBenefit(failed);
        return { ok: false, benefit: failed, errorCode, message };
      }
    },
    [generatedBenefit]
  );

  const clearSession = useCallback(() => {
    setGeneratedBenefit(null);
  }, []);

  const value = useMemo(
    () => ({
      generatedBenefit,
      generateBenefit,
      verifyBenefit,
      markVerified,
      redeemBenefit,
      clearSession,
    }),
    [
      generatedBenefit,
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
