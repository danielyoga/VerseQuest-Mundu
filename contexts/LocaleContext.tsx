"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  hydrated: boolean;
};

const LocaleContext = createContext<Ctx | null>(null);

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === "en" || v === "id") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function defaultLocaleFromNavigator(): Locale {
  if (typeof navigator === "undefined") return "id";
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only hydration from localStorage
    setLocaleState(stored ?? defaultLocaleFromNavigator());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return;
    document.documentElement.lang = locale === "id" ? "id" : "en";
  }, [locale, hydrated]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== LOCALE_STORAGE_KEY) return;
      if (e.newValue === "en" || e.newValue === "id") {
        setLocaleState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l);
    } catch {
      /* quota / private mode */
    }
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, hydrated }),
    [locale, setLocale, hydrated]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
