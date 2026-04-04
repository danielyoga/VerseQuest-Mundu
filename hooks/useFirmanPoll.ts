"use client";

import { useCallback, useEffect, useState } from "react";
import { toLocalDateString } from "@/lib/date-utils";
import {
  getFirmanPollForDay,
  setFirmanPollForDay,
} from "@/lib/firman-poll-storage";

function yesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

export function useFirmanPoll() {
  const [hydrated, setHydrated] = useState(false);
  const [doneForToday, setDoneForToday] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, boolean>>({});
  const [doneYesterday, setDoneYesterday] = useState(false);

  const refresh = useCallback(() => {
    const ymd = toLocalDateString(new Date());
    const row = getFirmanPollForDay(ymd);
    setDoneForToday(Boolean(row));
    setSavedAnswers(row?.answers ?? {});
    setDoneYesterday(Boolean(getFirmanPollForDay(yesterdayYmd())));
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

  return { hydrated, doneForToday, doneYesterday, savedAnswers, submit, refresh };
}
