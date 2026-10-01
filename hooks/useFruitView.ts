"use client";

import { useEffect, useState } from "react";
import { getFruitState, toLocalDateStr, type FruitView } from "@/lib/fruitStreak";

/**
 * The user's fruit streak as of today. Recomputed on mount, when `refreshKey` changes,
 * and whenever the app regains focus (an app left open overnight shows the new date).
 */
export function useFruitView(phone: string | null | undefined, refreshKey = 0): FruitView | null {
  const [view, setView] = useState<FruitView | null>(null);

  useEffect(() => {
    if (!phone) return;
    const read = () => setView(getFruitState(phone, toLocalDateStr(new Date())));
    const onVisible = () => {
      if (document.visibilityState === "visible") read();
    };
    read();
    window.addEventListener("focus", read);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", read);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [phone, refreshKey]);

  return phone ? view : null;
}
