"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUser, type AppUser, type UserStats } from "@/hooks/useUser";

interface UserContextValue {
  user: AppUser | null;
  stats: UserStats | null;
  loading: boolean;
  statsLoading: boolean;
  refresh: () => void;
  refreshStats: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserContextProvider({ children }: { children: ReactNode }) {
  const value = useUser();
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used inside UserContextProvider");
  return ctx;
}
