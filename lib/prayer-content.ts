/** Daily prayer content shared by the API route and the client (no server-only imports). */

export type PrayerRow = { date: string; text: string };

export type PrayerSource = "sheet" | "cache" | "default";

export type PrayerPayload = {
  /** Date of the row that was used (YYYY-MM-DD), null for the built-in default. */
  date: string | null;
  text: string;
  source: PrayerSource;
};

export const PRAYER_MAX_CHARS = 1000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isPrayerDate(s: string): boolean {
  return DATE_RE.test(s);
}

/** Shown when the Prayers tab is empty or unreachable and nothing is cached. */
export const DEFAULT_PRAYERS: readonly string[] = [
  "Tuhan, terima kasih untuk hari yang baru ini. Tuntun langkahku, jagalah hati dan pikiranku, dan tolong aku mengasihi sesama seperti Engkau mengasihiku. Dalam nama Tuhan Yesus aku berdoa.",
];

export function defaultPrayer(): PrayerPayload {
  return { date: null, text: DEFAULT_PRAYERS[0], source: "default" };
}

/**
 * Fallback chain: the row for `today`, else the most recent earlier row, else null.
 * Rows with a bad date or empty text are ignored.
 */
export function pickPrayer(rows: readonly PrayerRow[], today: string): PrayerRow | null {
  let best: PrayerRow | null = null;
  for (const row of rows) {
    if (!isPrayerDate(row.date) || !row.text.trim() || row.date > today) continue;
    if (!best || row.date > best.date) best = row;
  }
  return best;
}

export type PrayerTextError = "empty" | "too_long";

/** Admin input → stored text: HTML tags stripped, line breaks normalised to \n, trimmed. */
export function sanitizePrayerText(raw: string): string {
  return raw.replace(/<[^>]*>/g, "").replace(/\r\n?/g, "\n").trim();
}

export function validatePrayerText(
  raw: string
): { ok: true; text: string } | { ok: false; error: PrayerTextError } {
  const text = sanitizePrayerText(raw);
  if (!text) return { ok: false, error: "empty" };
  if (text.length > PRAYER_MAX_CHARS) return { ok: false, error: "too_long" };
  return { ok: true, text };
}
