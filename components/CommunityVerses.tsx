"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { bookDisplayName } from "@/lib/bible/book-names-id";
import {
  filterRefsInTodaySchedule,
  type CommunityRefInput,
  type VerseRef,
} from "@/lib/community/filter-schedule";
import { toLocalDateString } from "@/lib/date-utils";
import { messages } from "@/lib/i18n";
import type { ScheduleVerseRow, ScheduleWindowResponse } from "@/lib/schedule/window-types";

type DisplayItem = {
  ref: VerseRef;
  text: string;
};

export function CommunityVerses() {
  const { locale } = useLocale();
  const m = messages[locale];
  const [items, setItems] = useState<DisplayItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      void (async () => {
        try {
          const ymd = toLocalDateString(new Date());
          const schedRes = await fetch(
            `/api/schedule-window?from=${encodeURIComponent(ymd)}&days=4`,
            { cache: "no-store" }
          );
          const sched = (await schedRes.json()) as ScheduleWindowResponse;
          if (cancelled) return;

          const d = new Date();
          const month = d.getMonth() + 1;
          const date = d.getDate();
          const todayEntry = sched.days?.find(
            (x) => x.month === month && x.date === date
          );

          /** Tight Sheets range: header row + at most one row per verse in today’s passage. */
          let communityUrl = "/api/verse-community";
          if (
            todayEntry &&
            todayEntry.ok &&
            todayEntry.verses.length > 0
          ) {
            const maxRows = 1 + todayEntry.verses.length;
            communityUrl = `/api/verse-community?maxRows=${maxRows}`;
          }

          const commRes = await fetch(communityUrl, { cache: "no-store" });
          const comm = (await commRes.json()) as { verses?: CommunityRefInput[] };
          if (cancelled) return;

          const refs = Array.isArray(comm.verses) ? comm.verses : [];

          let scheduleBook: string | null = null;
          let passage: ScheduleVerseRow[] | null = null;
          if (todayEntry && todayEntry.ok) {
            scheduleBook = todayEntry.book;
            passage = todayEntry.verses;
          }

          const filtered = filterRefsInTodaySchedule(refs, scheduleBook, passage);
          const display: DisplayItem[] = [];
          if (scheduleBook && passage) {
            for (const ref of filtered) {
              const row = passage.find(
                (p) => p.chapter === ref.chapter && p.verse === ref.verse
              );
              if (row) {
                display.push({ ref, text: row.text });
              }
            }
          }

          setItems(display);
        } catch {
          if (!cancelled) setItems([]);
        }
      })();
    }
    load();
    function onRefresh() {
      load();
    }
    window.addEventListener("versequest-community-refresh", onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener("versequest-community-refresh", onRefresh);
    };
  }, []);

  const showEmpty = items !== null && items.length === 0;

  return (
    <div className="min-h-[min(100dvh,880px)] bg-[var(--vq-canvas)] px-4 py-6">
      <div className="mx-auto max-w-[390px]">
        <header className="mb-5">
          <h1 className="text-[22px] font-medium text-[var(--vq-text)]">{m.communityTitle}</h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--vq-muted)]">{m.communitySubtitle}</p>
        </header>

        {items === null ? (
          <p className="text-sm text-[var(--vq-muted)]">{m.communityLoading}</p>
        ) : showEmpty ? (
          <p className="text-center text-[15px] leading-relaxed text-[var(--vq-muted)]">
            {m.communityEmptyExact}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const label = `${bookDisplayName(item.ref.book, locale)} ${item.ref.chapter}:${item.ref.verse}`;
              const key = `${item.ref.book}-${item.ref.chapter}-${item.ref.verse}`;
              return (
                <li
                  key={key}
                  className="rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg)] px-4 py-3 shadow-sm"
                >
                  <p className="text-[15px] font-semibold text-[#534AB7]">{label}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--vq-text)]">{item.text}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
