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
  DEFAULT_DISPLAY_ORDER,
  DISPLAY_ORDER_STORAGE_KEY,
  type DisplayOrder,
} from "@/lib/display-order";

type Ctx = {
  displayOrder: DisplayOrder;
  setDisplayOrder: (o: DisplayOrder) => void;
  hydrated: boolean;
};

const DisplayOrderContext = createContext<Ctx | null>(null);

function readStoredDisplayOrder(): DisplayOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(DISPLAY_ORDER_STORAGE_KEY);
    if (v === "missions_first" || v === "reading_first") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function DisplayOrderProvider({ children }: { children: React.ReactNode }) {
  const [displayOrder, setDisplayOrderState] = useState<DisplayOrder>(
    DEFAULT_DISPLAY_ORDER
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredDisplayOrder();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only hydration from localStorage
    setDisplayOrderState(stored ?? DEFAULT_DISPLAY_ORDER);
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== DISPLAY_ORDER_STORAGE_KEY) return;
      if (e.newValue === "missions_first" || e.newValue === "reading_first") {
        setDisplayOrderState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setDisplayOrder = useCallback((o: DisplayOrder) => {
    setDisplayOrderState(o);
    try {
      localStorage.setItem(DISPLAY_ORDER_STORAGE_KEY, o);
    } catch {
      /* quota / private mode */
    }
  }, []);

  const value = useMemo(
    () => ({ displayOrder, setDisplayOrder, hydrated }),
    [displayOrder, setDisplayOrder, hydrated]
  );

  return (
    <DisplayOrderContext.Provider value={value}>
      {children}
    </DisplayOrderContext.Provider>
  );
}

export function useDisplayOrder() {
  const ctx = useContext(DisplayOrderContext);
  if (!ctx) {
    throw new Error("useDisplayOrder must be used within DisplayOrderProvider");
  }
  return ctx;
}
