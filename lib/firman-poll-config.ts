import type { Locale } from "@/lib/i18n";

export type FirmanPollQuestionDef = {
  id: string;
  /** English label */
  text: string;
  /** Indonesian label (optional; falls back to `text`) */
  textId?: string;
};

export type FirmanPollConfig = {
  /** Optional modal title; falls back to i18n */
  title?: { en: string; id: string };
  subtitle?: { en: string; id: string };
  questions: FirmanPollQuestionDef[];
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseQuestions(raw: unknown): FirmanPollQuestionDef[] | null {
  if (!Array.isArray(raw)) return null;
  const out: FirmanPollQuestionDef[] = [];
  for (const item of raw) {
    if (!isRecord(item)) return null;
    const id = item.id;
    const text = item.text;
    if (typeof id !== "string" || !id.trim()) return null;
    if (typeof text !== "string" || !text.trim()) return null;
    const textId = item.textId;
    out.push({
      id: id.trim(),
      text: text.trim(),
      ...(typeof textId === "string" && textId.trim() ? { textId: textId.trim() } : {}),
    });
  }
  if (out.length < 1 || out.length > 12) return null;
  const ids = new Set(out.map((q) => q.id));
  if (ids.size !== out.length) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[firman-poll] NEXT_PUBLIC_FIRMAN_POLL_QUESTIONS: each question needs a unique `id` (duplicate ids were rejected)."
      );
    }
    return null;
  }
  return out;
}

/**
 * `NEXT_PUBLIC_FIRMAN_POLL_QUESTIONS` — JSON string. Either:
 * - `[{ "id": "q1", "text": "…", "textId": "…" }, …]` (4–5 items typical)
 * - `{ "questions": […], "title": { "en":"…","id":"…" }, "subtitle": {…} }`
 */
export function parseFirmanPollConfig(raw: string | undefined): FirmanPollConfig | null {
  if (raw == null || !String(raw).trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const questions = parseQuestions(parsed);
      if (!questions) return null;
      return { questions };
    }
    if (!isRecord(parsed)) return null;
    const questions = parseQuestions(parsed.questions);
    if (!questions) return null;
    const title =
      isRecord(parsed.title) &&
      typeof parsed.title.en === "string" &&
      typeof parsed.title.id === "string"
        ? { en: parsed.title.en.trim(), id: parsed.title.id.trim() }
        : undefined;
    const subtitle =
      isRecord(parsed.subtitle) &&
      typeof parsed.subtitle.en === "string" &&
      typeof parsed.subtitle.id === "string"
        ? { en: parsed.subtitle.en.trim(), id: parsed.subtitle.id.trim() }
        : undefined;
    return { questions, title, subtitle };
  } catch {
    return null;
  }
}

export function getFirmanPollConfig(): FirmanPollConfig | null {
  return parseFirmanPollConfig(process.env.NEXT_PUBLIC_FIRMAN_POLL_QUESTIONS);
}

export function questionLabel(q: FirmanPollQuestionDef, locale: Locale): string {
  if (locale === "id" && q.textId) return q.textId;
  return q.text;
}

export function localizedOptional(
  pair: { en: string; id: string } | undefined,
  locale: Locale,
  fallback: string
): string {
  if (!pair) return fallback;
  return locale === "id" ? pair.id : pair.en;
}
