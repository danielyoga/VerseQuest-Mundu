"use client";

import { useCallback, useEffect, useState } from "react";
import { getTodayGratitude, setTodayGratitude } from "@/lib/gratitude-storage";

export function useGratitudeQuest() {
  const [hydrated, setHydrated] = useState(false);
  const [doneForToday, setDoneForToday] = useState(false);
  const [savedItems, setSavedItems] = useState<[string, string, string]>([
    "",
    "",
    "",
  ]);

  const refresh = useCallback(() => {
    const row = getTodayGratitude();
    setDoneForToday(Boolean(row));
    if (row?.items) {
      setSavedItems(row.items);
    } else {
      setSavedItems(["", "", ""]);
    }
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
  }, [refresh]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  function submit(items: [string, string, string]) {
    setTodayGratitude(items);
    setDoneForToday(true);
    setSavedItems(items);
  }

  return { hydrated, doneForToday, savedItems, submit, refresh };
}
