import { toLocalDateString } from "@/lib/date-utils";

export const GRATITUDE_STORAGE_KEY = "versequest_gratitude_v1";

export type DayPayload = {
  items: [string, string, string];
  submittedAt: number;
};

/** v2: single object — only today; past dates are dropped on read/write. */
type StoreV2 = {
  v: 2;
  date: string;
  items: [string, string, string];
  submittedAt: number;
};

type StoreV1 = {
  v: 1;
  days: Record<string, { items: unknown; submittedAt: number }>;
};

function isTriple(items: unknown): items is [string, string, string] {
  if (!Array.isArray(items) || items.length !== 3) return false;
  return items.every((x) => typeof x === "string");
}

function clearStorage() {
  try {
    localStorage.removeItem(GRATITUDE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function writeV2(ymd: string, items: [string, string, string]) {
  const payload: StoreV2 = {
    v: 2,
    date: ymd,
    items: [items[0], items[1], items[2]],
    submittedAt: Date.now(),
  };
  try {
    localStorage.setItem(GRATITUDE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function migrateV1IfNeeded(parsed: unknown, todayYmd: string): DayPayload | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const rec = parsed as StoreV1;
  if (rec.v !== 1 || typeof rec.days !== "object" || rec.days === null) return null;
  const row = rec.days[todayYmd];
  if (!row || typeof row.submittedAt !== "number" || !isTriple(row.items)) {
    clearStorage();
    return null;
  }
  const out: DayPayload = {
    items: row.items,
    submittedAt: row.submittedAt,
  };
  writeV2(todayYmd, out.items);
  return out;
}

/**
 * Returns today’s gratitude if stored and still “today”; otherwise null.
 * Stale or past-day data is removed from localStorage.
 */
export function getTodayGratitude(): DayPayload | null {
  if (typeof window === "undefined") return null;
  const todayYmd = toLocalDateString(new Date());
  try {
    const raw = localStorage.getItem(GRATITUDE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;

    if (typeof parsed !== "object" || parsed === null) {
      clearStorage();
      return null;
    }

    const o = parsed as Record<string, unknown>;

    if (o.v === 2) {
      if (o.date !== todayYmd) {
        clearStorage();
        return null;
      }
      if (typeof o.submittedAt !== "number" || !isTriple(o.items)) {
        clearStorage();
        return null;
      }
      return {
        items: o.items,
        submittedAt: o.submittedAt,
      };
    }

    if (o.v === 1) {
      return migrateV1IfNeeded(parsed, todayYmd);
    }

    clearStorage();
    return null;
  } catch {
    clearStorage();
    return null;
  }
}

/** Persists only today’s triple; overwrites any previous blob (no history kept). */
export function setTodayGratitude(items: [string, string, string]) {
  if (typeof window === "undefined") return;
  const ymd = toLocalDateString(new Date());
  writeV2(ymd, items);
}
