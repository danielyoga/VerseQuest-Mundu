"use client";

import { useCallback, useEffect, useState } from "react";
import { toLocalDateString } from "@/lib/date-utils";
import {
  getFirmanPollForDay,
  setFirmanPollForDay,
} from "@/lib/firman-poll-storage";

export function useFirmanPoll() {
  const [hydrated, setHydrated] = useState(false);
  const [doneForToday, setDoneForToday] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, boolean>>({});

  const refresh = useCallback(() => {
    const ymd = toLocalDateString(new Date());
    const row = getFirmanPollForDay(ymd);
    setDoneForToday(Boolean(row));
    setSavedAnswers(row?.answers ?? {});
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

  function submit(answers: Record<string, boolean>) {
    const ymd = toLocalDateString(new Date());
    setFirmanPollForDay(ymd, answers);
    setDoneForToday(true);
    setSavedAnswers(answers);
  }

  return { hydrated, doneForToday, savedAnswers, submit, refresh };
}
