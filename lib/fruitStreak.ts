// lib/fruitStreak.ts
// All streak logic. UI components only call these functions. localStorage only — no Sheets calls.
import { CYCLE_DAYS, DAYS_PER_FRUIT, FRUITS, type Fruit } from "@/lib/fruitsOfSpirit";

export type FruitStreakState = {
  streak: number;
  lastAmenDate: string | null; // YYYY-MM-DD, device local time
  cyclesCompleted: number;
};

export type FruitView = FruitStreakState & {
  fruitIndex: number;   // 0..8
  dayInFruit: number;   // 1..7 (0 when streak is 0)
  fruit: Fruit;
  isBroken: boolean;    // last Amen was more than 1 day ago (or in the future)
  amenDoneToday: boolean;
};

export type AmenResult = {
  state: FruitView;
  advanced: boolean;        // false = same-day repeat
  fruitCompleted: boolean;  // dayInFruit === 7 after this Amen
  cycleCompleted: boolean;  // streak hit a multiple of 63
  wasReset: boolean;        // a previous streak existed and was restarted
};

const DEFAULT_STATE: FruitStreakState = { streak: 0, lastAmenDate: null, cyclesCompleted: 0 };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const storageKey = (phone: string) => `vq_fruit_streak_v1:${phone}`;

/** YYYY-MM-DD in device local time. Never use toISOString (that is UTC). */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days from a to b (b - a). Built from Y/M/D components, so DST never shifts it. */
export function daysBetween(a: string, b: string): number {
  const toUtc = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

function isValidState(x: unknown): x is FruitStreakState {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return (
    Number.isInteger(s.streak) && (s.streak as number) >= 0 &&
    Number.isInteger(s.cyclesCompleted) && (s.cyclesCompleted as number) >= 0 &&
    (s.lastAmenDate === null || (typeof s.lastAmenDate === "string" && DATE_RE.test(s.lastAmenDate)))
  );
}

function load(phone: string): FruitStreakState {
  try {
    const raw = localStorage.getItem(storageKey(phone));
    if (!raw) return { ...DEFAULT_STATE };
    const parsed: unknown = JSON.parse(raw);
    return isValidState(parsed) ? parsed : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE }; // private mode, quota, corrupt JSON
  }
}

function save(phone: string, state: FruitStreakState): void {
  try {
    localStorage.setItem(storageKey(phone), JSON.stringify(state));
  } catch {
    /* storage unavailable: feature degrades silently, app must not crash */
  }
}

/** fruitIndex = floor((streak-1)/7) mod 9 ; dayInFruit = ((streak-1) mod 7) + 1 */
export function deriveFruit(streak: number) {
  if (streak < 1) return { fruitIndex: 0, dayInFruit: 0 };
  return {
    fruitIndex: Math.floor((streak - 1) / DAYS_PER_FRUIT) % FRUITS.length,
    dayInFruit: ((streak - 1) % DAYS_PER_FRUIT) + 1,
  };
}

function toView(s: FruitStreakState, today: string): FruitView {
  const { fruitIndex, dayInFruit } = deriveFruit(s.streak);
  const diff = s.lastAmenDate ? daysBetween(s.lastAmenDate, today) : null;
  return {
    ...s,
    fruitIndex,
    dayInFruit,
    fruit: FRUITS[fruitIndex],
    isBroken: diff !== null && (diff > 1 || diff < 0),
    amenDoneToday: s.lastAmenDate === today,
  };
}

export function getFruitState(phone: string, today: string): FruitView {
  return toView(load(phone), today);
}

export function recordAmen(phone: string, today: string): AmenResult {
  const prev = load(phone);

  // 1. Same day: no change, show today"s card again.
  if (prev.lastAmenDate === today) {
    return { state: toView(prev, today), advanced: false, fruitCompleted: false, cycleCompleted: false, wasReset: false };
  }

  // 2. Consecutive day → +1, otherwise (null, gap > 1, negative) → 1.
  const diff = prev.lastAmenDate ? daysBetween(prev.lastAmenDate, today) : null;
  const consecutive = diff === 1;
  const streak = consecutive ? prev.streak + 1 : 1;
  const wasReset = !consecutive && prev.streak > 0;

  // 3. Passing day 63 (64, 127, …) → one more completed cycle.
  const cyclesCompleted =
    streak > 1 && streak % CYCLE_DAYS === 1 ? prev.cyclesCompleted + 1 : prev.cyclesCompleted;

  // 4. Save and report.
  const next: FruitStreakState = { streak, lastAmenDate: today, cyclesCompleted };
  save(phone, next);
  const view = toView(next, today);
  return {
    state: view,
    advanced: true,
    fruitCompleted: view.dayInFruit === DAYS_PER_FRUIT,
    cycleCompleted: streak % CYCLE_DAYS === 0,
    wasReset,
  };
}

/** Call after every successful login. Idempotent, origin-level flag. */
export async function ensurePersistentStorage(): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  } catch {
    /* ignore */
  }
}
