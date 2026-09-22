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
import { applyMilestoneApproval } from "@/lib/milestones/actions";
import { fetchMilestonesFromServer } from "@/lib/milestones/approve-client";
import {
  INITIAL_HUARAL_MILESTONES,
  countApprovedMilestones,
  countPendingMilestones,
} from "@/lib/milestones/data";
import type { Milestone } from "@/lib/milestones/types";
import type { MilestoneApprovalProof } from "@/lib/milestones/actions";

const STORAGE_KEY = "qhapaq.huaral.milestones.v1";

type MilestonesContextValue = {
  milestones: Milestone[];
  approvedCount: number;
  pendingCount: number;
  totalCount: number;
  /** Apply approval only after a successful Stellar proof response. */
  recordApprovedMilestone: (
    id: string,
    proof: MilestoneApprovalProof
  ) => boolean;
  resetMilestones: () => void;
  refreshMilestones: () => Promise<void>;
  isHydrated: boolean;
};

const MilestonesContext = createContext<MilestonesContextValue | null>(null);

function normalizeMilestoneList(
  items: Array<Partial<Milestone> & { id: string }>
): Milestone[] | null {
  const byId = new Map(
    INITIAL_HUARAL_MILESTONES.map((m) => [m.id, m] as const)
  );

  const next: Milestone[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const id = typeof item.id === "string" ? item.id : null;
    const seed = id ? byId.get(id) : undefined;
    if (!id || !seed) continue;

    const status =
      item.status === "approved" || item.status === "pending"
        ? item.status
        : "pending";

    const transactionHash =
      typeof item.transactionHash === "string" &&
      item.transactionHash.trim().length > 0
        ? item.transactionHash.trim()
        : undefined;

    next.push({
      ...seed,
      status,
      approvedAt:
        typeof item.approvedAt === "string" ? item.approvedAt : undefined,
      approvedBy:
        typeof item.approvedBy === "string" ? item.approvedBy : undefined,
      transactionHash,
    });
  }

  if (next.length !== INITIAL_HUARAL_MILESTONES.length) return null;

  const order = new Map(
    INITIAL_HUARAL_MILESTONES.map((m, index) => [m.id, index])
  );
  next.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return next;
}

function parseStoredMilestones(raw: string | null): Milestone[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return normalizeMilestoneList(
      parsed as Array<Partial<Milestone> & { id: string }>
    );
  } catch {
    return null;
  }
}

/**
 * Prefer server (process memory) when it has a real on-chain approval;
 * otherwise keep richer localStorage / seed data for the session.
 */
function mergeMilestones(
  local: Milestone[] | null,
  remote: Milestone[] | null
): Milestone[] {
  const base = local ?? INITIAL_HUARAL_MILESTONES;
  if (!remote) return base;

  return base.map((localItem) => {
    const remoteItem = remote.find((m) => m.id === localItem.id);
    if (!remoteItem) return localItem;

    if (
      remoteItem.status === "approved" &&
      remoteItem.transactionHash
    ) {
      return remoteItem;
    }

    if (
      localItem.status === "approved" &&
      localItem.transactionHash &&
      remoteItem.status !== "approved"
    ) {
      return localItem;
    }

    if (remoteItem.status === "approved") {
      return {
        ...localItem,
        ...remoteItem,
        transactionHash:
          remoteItem.transactionHash ?? localItem.transactionHash,
      };
    }

    return localItem.status === "approved" ? localItem : remoteItem;
  });
}

export function MilestonesProvider({ children }: { children: ReactNode }) {
  const [milestones, setMilestones] = useState<Milestone[]>(
    INITIAL_HUARAL_MILESTONES
  );
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshMilestones = useCallback(async () => {
    const local = parseStoredMilestones(
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null
    );
    const remoteRaw = await fetchMilestonesFromServer();
    const remote = remoteRaw
      ? normalizeMilestoneList(remoteRaw)
      : null;
    setMilestones(mergeMilestones(local, remote));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = parseStoredMilestones(
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null
      );
      const remoteRaw = await fetchMilestonesFromServer();
      const remote = remoteRaw
        ? normalizeMilestoneList(remoteRaw)
        : null;

      if (!cancelled) {
        setMilestones(mergeMilestones(local, remote));
        setIsHydrated(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
  }, [milestones, isHydrated]);

  const recordApprovedMilestone = useCallback(
    (id: string, proof: MilestoneApprovalProof) => {
      let didApprove = false;

      setMilestones((current) => {
        const result = applyMilestoneApproval(current, id, proof);
        didApprove = result.didApprove;
        return result.milestones;
      });

      return didApprove;
    },
    []
  );

  const resetMilestones = useCallback(() => {
    setMilestones(INITIAL_HUARAL_MILESTONES);
  }, []);

  const value = useMemo(
    () => ({
      milestones,
      approvedCount: countApprovedMilestones(milestones),
      pendingCount: countPendingMilestones(milestones),
      totalCount: milestones.length,
      recordApprovedMilestone,
      resetMilestones,
      refreshMilestones,
      isHydrated,
    }),
    [
      milestones,
      recordApprovedMilestone,
      resetMilestones,
      refreshMilestones,
      isHydrated,
    ]
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
