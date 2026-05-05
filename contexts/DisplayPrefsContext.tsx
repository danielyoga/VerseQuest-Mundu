"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import {
  DEFAULT_DENSITY, DEFAULT_STREAK_STYLE,
  DISPLAY_DENSITY_KEY, DISPLAY_STREAK_STYLE_KEY,
  type Density, type StreakStyle,
} from "@/lib/display-prefs";

type Ctx = {
  density: Density;
  setDensity: (v: Density) => void;
  streakStyle: StreakStyle;
  setStreakStyle: (v: StreakStyle) => void;
};

const DisplayPrefsContext = createContext<Ctx | null>(null);

function read<T extends string>(key: string, valid: T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v && (valid as string[]).includes(v)) return v as T;
  } catch { /* ignore */ }
  return fallback;
}

function persist(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* quota / private mode */ }
}

export function DisplayPrefsProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<Density>(DEFAULT_DENSITY);
  const [streakStyle, setStreakStyleState] = useState<StreakStyle>(DEFAULT_STREAK_STYLE);

  useEffect(() => {
    setDensityState(read<Density>(DISPLAY_DENSITY_KEY, ["compact", "regular"], DEFAULT_DENSITY));
    setStreakStyleState(read<StreakStyle>(DISPLAY_STREAK_STYLE_KEY, ["arc", "minimal"], DEFAULT_STREAK_STYLE));
  }, []);

  const setDensity = useCallback((v: Density) => {
    setDensityState(v);
    persist(DISPLAY_DENSITY_KEY, v);
  }, []);

  const setStreakStyle = useCallback((v: StreakStyle) => {
    setStreakStyleState(v);
    persist(DISPLAY_STREAK_STYLE_KEY, v);
  }, []);

  const value = useMemo(
    () => ({ density, setDensity, streakStyle, setStreakStyle }),
    [density, setDensity, streakStyle, setStreakStyle],
  );

  return (
    <DisplayPrefsContext.Provider value={value}>
      {children}
    </DisplayPrefsContext.Provider>
  );
}

export function useDisplayPrefs() {
  const ctx = useContext(DisplayPrefsContext);
  if (!ctx) throw new Error("useDisplayPrefs must be used within DisplayPrefsProvider");
  return ctx;
}
