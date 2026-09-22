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
import { approveMilestone as applyApproveMilestone } from "@/lib/milestones/actions";
import {
  INITIAL_HUARAL_MILESTONES,
  countApprovedMilestones,
  countPendingMilestones,
} from "@/lib/milestones/data";
import type { Milestone } from "@/lib/milestones/types";

const STORAGE_KEY = "qhapaq.huaral.milestones.v1";

type MilestonesContextValue = {
  milestones: Milestone[];
  approvedCount: number;
  pendingCount: number;
  totalCount: number;
  approveMilestone: (id: string, approvedBy: string) => boolean;
  resetMilestones: () => void;
  isHydrated: boolean;
};

const MilestonesContext = createContext<MilestonesContextValue | null>(null);

function parseStoredMilestones(raw: string | null): Milestone[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const byId = new Map(
      INITIAL_HUARAL_MILESTONES.map((m) => [m.id, m] as const)
    );

    const next: Milestone[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : null;
      const seed = id ? byId.get(id) : undefined;
      if (!id || !seed) continue;

      const status =
        record.status === "approved" || record.status === "pending"
          ? record.status
          : "pending";

      const transactionHash =
        typeof record.transactionHash === "string" &&
        record.transactionHash.trim().length > 0
          ? record.transactionHash.trim()
          : undefined;

      next.push({
        ...seed,
        status,
        approvedAt:
          typeof record.approvedAt === "string" ? record.approvedAt : undefined,
        approvedBy:
          typeof record.approvedBy === "string" ? record.approvedBy : undefined,
        transactionHash,
      });
    }

    if (next.length !== INITIAL_HUARAL_MILESTONES.length) return null;

    const order = new Map(
      INITIAL_HUARAL_MILESTONES.map((m, index) => [m.id, index])
    );
    next.sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
    return next;
  } catch {
    return null;
  }
}

export function MilestonesProvider({ children }: { children: ReactNode }) {
  const [milestones, setMilestones] = useState<Milestone[]>(
    INITIAL_HUARAL_MILESTONES
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = parseStoredMilestones(
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null
    );
    if (stored) {
      setMilestones(stored);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
  }, [milestones, isHydrated]);

  const approveMilestone = useCallback((id: string, approvedBy: string) => {
    let didApprove = false;

    setMilestones((current) => {
      const result = applyApproveMilestone(current, id, approvedBy);
      didApprove = result.didApprove;
      return result.milestones;
    });

    return didApprove;
  }, []);

  const resetMilestones = useCallback(() => {
    setMilestones(INITIAL_HUARAL_MILESTONES);
  }, []);

  const value = useMemo(
    () => ({
      milestones,
      approvedCount: countApprovedMilestones(milestones),
      pendingCount: countPendingMilestones(milestones),
      totalCount: milestones.length,
      approveMilestone,
      resetMilestones,
      isHydrated,
    }),
    [milestones, approveMilestone, resetMilestones, isHydrated]
  );

  return (
    <MilestonesContext.Provider value={value}>
      {children}
    </MilestonesContext.Provider>
  );
}

export function useMilestones(): MilestonesContextValue {
  const context = useContext(MilestonesContext);
  if (!context) {
    throw new Error("useMilestones must be used within a MilestonesProvider");
  }
  return context;
}
