"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";

export function StatsRefresher() {
  const pathname = usePathname();
  const { refreshStats } = useUserContext();

  useEffect(() => {
    refreshStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
