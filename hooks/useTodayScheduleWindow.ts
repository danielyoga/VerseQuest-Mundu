"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type { ScheduleEntry } from "@/lib/bible/schedule";
import { toLocalDateString } from "@/lib/date-utils";
import {
  clearScheduleWindowCache,
  isUsableCachedScheduleDay,
  readScheduleWindowCache,
  writeScheduleWindowCache,
} from "@/lib/schedule/window-cache";
import type {
  ScheduleVerseRow,
  ScheduleWindowDay,
  ScheduleWindowResponse,
} from "@/lib/schedule/window-types";

export type SchedulePassageStatus =
  | "idle"
  | "loading"
  | "ok"
  | "error"
  | "no_plan"
  | "verses_pending";

export function scheduleVerseKey(row: { chapter: number; verse: number }) {
  return `${row.chapter}-${row.verse}`;
}

export function useTodayScheduleWindow() {
  const [todaySchedule, setTodaySchedule] = useState<ScheduleEntry | null>(null);
  const [schedulePassage, setSchedulePassage] = useState<
    ScheduleVerseRow[] | null
  >(null);
  const [schedulePassageStatus, setSchedulePassageStatus] =
    useState<SchedulePassageStatus>("loading");
  const [scheduleVerseSelectedKey, setScheduleVerseSelectedKey] = useState<
    string | null
  >(null);

  useLayoutEffect(() => {
    const d = new Date();
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const ymd = toLocalDateString(d);

    function applyScheduleWindowDay(day: ScheduleWindowDay | undefined) {
      if (!day) {
        setSchedulePassageStatus("error");
        return;
      }
      if (!day.ok) {
        if (day.reason === "no_row") {
          setTodaySchedule(null);
          setSchedulePassage(null);
          setSchedulePassageStatus("no_plan");
        } else if (day.book != null && day.reading != null) {
          setTodaySchedule({
            month: day.month,
            date: day.date,
            book: day.book,
            reading: day.reading,
          });
          setSchedulePassage(null);
          setSchedulePassageStatus(
            day.reason === "verses_empty" || day.reason === "verses_invalid"
              ? "verses_pending"
              : "error"
          );
        } else {
          setSchedulePassageStatus("error");
        }
        return;
      }
      setTodaySchedule({
        month: day.month,
        date: day.date,
        book: day.book,
        reading: day.reading,
      });
      setSchedulePassage(day.verses);
      setSchedulePassageStatus("ok");
    }

    const cached = readScheduleWindowCache(ymd);
    const todayEntry = cached?.days?.find(
      (x) => x.month === month && x.date === date
    );

    if (isUsableCachedScheduleDay(todayEntry)) {
      applyScheduleWindowDay(todayEntry);
      return;
    }

    if (cached?.days?.length) {
      clearScheduleWindowCache();
    }

    const ac = new AbortController();
    setSchedulePassageStatus("loading");
    setSchedulePassage(null);
    setTodaySchedule(null);

    fetch(`/api/schedule-window?from=${encodeURIComponent(ymd)}&days=4`, {
      cache: "no-store",
      signal: ac.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("bad_response");
        return res.json() as Promise<ScheduleWindowResponse>;
      })
      .then((data) => {
        if (ac.signal.aborted) return;
        writeScheduleWindowCache(ymd, data);
        const entry = data.days?.find(
          (x) => x.month === month && x.date === date
        );
        applyScheduleWindowDay(entry);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ac.signal.aborted) setSchedulePassageStatus("error");
      });

    return () => ac.abort();
  }, []);

  useEffect(() => {
    setScheduleVerseSelectedKey(null);
  }, [schedulePassage]);

  return {
    todaySchedule,
    schedulePassage,
    schedulePassageStatus,
    scheduleVerseSelectedKey,
    setScheduleVerseSelectedKey,
  };
}
