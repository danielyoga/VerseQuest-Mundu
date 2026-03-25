import { toLocalDateString } from "@/lib/date-utils";

export const FIRMAN_POLL_STORAGE_KEY = "versequest_firman_poll_v1";

type DayPayload = {
  answers: Record<string, boolean>;
  submittedAt: number;
};

type StoreV1 = {
  v: 1;
  /** date YYYY-MM-DD → payload */
  days: Record<string, DayPayload>;
};

function emptyStore(): StoreV1 {
  return { v: 1, days: {} };
}

function readStore(): StoreV1 {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(FIRMAN_POLL_STORAGE_KEY);
    if (!raw) return emptyStore();
    const p = JSON.parse(raw) as unknown;
    if (typeof p !== "object" || p === null) return emptyStore();
    const rec = p as Record<string, unknown>;
    if (rec.v !== 1 || typeof rec.days !== "object" || rec.days === null) {
      return emptyStore();
    }
    return { v: 1, days: { ...(rec.days as Record<string, DayPayload>) } };
  } catch {
    return emptyStore();
  }
}

function writeStore(s: StoreV1) {
  try {
    localStorage.setItem(FIRMAN_POLL_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode */
  }
}

export function getFirmanPollForDay(ymd: string): DayPayload | null {
  const s = readStore();
  const row = s.days[ymd];
  if (!row || typeof row.submittedAt !== "number") return null;
  if (!row.answers || typeof row.answers !== "object") return null;
  return row;
}

export function setFirmanPollForDay(ymd: string, answers: Record<string, boolean>) {
  const s = readStore();
  s.days[ymd] = {
    answers: { ...answers },
    submittedAt: Date.now(),
  };
  writeStore(s);
}

export function getTodayFirmanPoll(): DayPayload | null {
  return getFirmanPollForDay(toLocalDateString(new Date()));
}
