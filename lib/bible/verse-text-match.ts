import { bookDisplayName } from "@/lib/bible/book-names-id";

/** Lowercase, collapse spaces, trim; safe for comparing TB / pasted text. */
export function normalizeForVerseMatch(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u00A0\u2000-\u200B\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Remove a leading "Book chapter:verse" (EN/ID names, optional spaces, Nehemiah5:14-style).
 */
export function stripLeadingReferencePrefix(
  normalized: string,
  book: string,
  chapter: number,
  verse: number
): string {
  const en = bookDisplayName(book, "en");
  const id = bookDisplayName(book, "id");
  const names = Array.from(new Set([book, en, id].filter(Boolean)));
  const alt = `(?:${names.map(escapeRegExp).join("|")})`;
  const ch = chapter;
  const v = verse;
  const re = new RegExp(`^${alt}\\s*${ch}\\s*[:.]\\s*${v}\\s*`, "i");
  const next = normalized.replace(re, "").trim();
  if (next !== normalized) return next;
  return normalized;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/** Words of length ≥3 (letters/digits), for overlap when substring checks fail. */
function significantTokens(s: string): string[] {
  return s
    .split(/\s+/)
    .map((t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((t) => t.length >= 3);
}

function tokenCoverage(userNorm: string, expectedNorm: string): number {
  const tokens = significantTokens(expectedNorm);
  if (tokens.length === 0) return 1;
  let hits = 0;
  for (const t of tokens) {
    if (userNorm.includes(t)) hits++;
  }
  return hits / tokens.length;
}

const MIN_EXPECTED_LEN = 12;
const MIN_INPUT_LEN = 8;

/**
 * True if pasted/typed text matches the scheduled verse body (TB) for this book/chapter/verse.
 * Case-insensitive; tolerates a leading reference line; optional fuzzy fallback.
 */
export function verseTextMatchesExpected(
  userInput: string,
  expectedText: string,
  book: string,
  chapter: number,
  verse: number
): boolean {
  const exp = normalizeForVerseMatch(expectedText);
  if (exp.length < MIN_EXPECTED_LEN) return true;

  let u = normalizeForVerseMatch(userInput);
  if (u.length < MIN_INPUT_LEN) return false;

  u = stripLeadingReferencePrefix(u, book, chapter, verse);

  if (u.includes(exp)) return true;
  if (exp.includes(u)) {
    const minPartial = Math.min(40, Math.max(20, Math.floor(exp.length * 0.3)));
    return u.length >= minPartial;
  }

  const cov = tokenCoverage(u, exp);
  if (cov >= 0.92) return true;

  const maxLen = Math.max(u.length, exp.length);
  if (maxLen === 0) return true;
  const dist = levenshtein(u, exp);
  if (dist / maxLen <= 0.06) return true;

  return false;
}
