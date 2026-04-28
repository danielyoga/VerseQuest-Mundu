"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession, type AppUser } from "@/lib/session";

export type { AppUser };

export interface UserStats {
  streak_count: number;
  xp_total: number;
  last_submitted_at: string | null;
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async (u: AppUser) => {
    setStatsLoading(true);
    try {
      const res = await fetch(
        `/api/user/me?phone=${encodeURIComponent(u.phone)}&ranting=${encodeURIComponent(u.ranting)}`
      );
      const data = (await res.json()) as Partial<UserStats & { error?: string }>;
      if (res.ok) {
        setStats({
          streak_count: data.streak_count ?? 0,
          xp_total: data.xp_total ?? 0,
          last_submitted_at: data.last_submitted_at ?? null,
        });
      }
    } catch {
      // silently fail — dashboard renders with null stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void fetchStats(user);
  }, [user, fetchStats]);

  const refresh = useCallback(() => {
    const session = getSession();
    setUser(session);
    if (session) void fetchStats(session);
  }, [fetchStats]);

  const refreshStats = useCallback(() => {
    if (user) void fetchStats(user);
  }, [user, fetchStats]);

  return { user, stats, loading, statsLoading, refresh, refreshStats };
}
