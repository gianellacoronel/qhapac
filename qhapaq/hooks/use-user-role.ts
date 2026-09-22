"use client";

import { useMemo } from "react";
import { useWallet } from "@/hooks/use-wallet";
import {
  getUserRole,
  type UserRole,
} from "@/lib/auth/role";

export type UserRoleState = {
  role: UserRole;
  isAdmin: boolean;
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  wallet: ReturnType<typeof useWallet>;
};

/** Role derived from the currently connected Freighter wallet. */
export function useUserRole(): UserRoleState {
  const wallet = useWallet();

  const role = useMemo(
    () => getUserRole(wallet.isConnected ? wallet.address : null),
    [wallet.isConnected, wallet.address]
  );

  return {
    role,
    isAdmin: role === "admin",
    address: wallet.address,
    isConnected: wallet.isConnected,
    isLoading: wallet.isLoading,
    wallet,
  };
}
