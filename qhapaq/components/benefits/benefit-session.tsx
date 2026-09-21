"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getBenefitDefinition } from "@/lib/benefits/data";
import type { GeneratedBenefit } from "@/lib/benefits/types";
import {
  createBenefitId,
  normalizeBenefitId,
} from "@/lib/benefits/utils";

type BenefitSessionContextValue = {
  generatedBenefit: GeneratedBenefit | null;
  generateBenefit: (definitionId: string) => GeneratedBenefit | null;
  verifyBenefit: (benefitId: string) => GeneratedBenefit | null;
  redeemBenefit: (benefitId: string) => GeneratedBenefit | null;
  clearSession: () => void;
};

const BenefitSessionContext = createContext<BenefitSessionContextValue | null>(
  null
);

export function BenefitSessionProvider({ children }: { children: ReactNode }) {
  const [generatedBenefit, setGeneratedBenefit] =
    useState<GeneratedBenefit | null>(null);

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
      if (normalizeBenefitId(generatedBenefit.id) !== normalizeBenefitId(benefitId)) {
        return null;
      }
      return generatedBenefit;
    },
    [generatedBenefit]
  );

  const redeemBenefit = useCallback(
    (benefitId: string): GeneratedBenefit | null => {
      const current = generatedBenefit;
      if (!current) return null;
      if (normalizeBenefitId(current.id) !== normalizeBenefitId(benefitId)) {
        return null;
      }
      if (current.status === "redeemed") return current;

      const redeemed: GeneratedBenefit = {
        ...current,
        status: "redeemed",
        redeemedAt: new Date().toISOString(),
      };
      setGeneratedBenefit(redeemed);
      return redeemed;
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
      redeemBenefit,
      clearSession,
    }),
    [
      generatedBenefit,
      generateBenefit,
      verifyBenefit,
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
