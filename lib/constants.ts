/** Full admin — firman + devotion access. E.164 format. */
export const ADMIN_PHONE = "+62812345678909999";

/** Devotion-only admin — devotion + reflection access only. E.164 format. */
export const DEVOTION_ADMIN_PHONE = "+62812349283748";

/**
 * Normalize an E.164 or local phone to the canonical 0xxxxxxxxx form
 * used throughout the app (same logic as lib/preregister.ts normalizePhone,
 * duplicated here to avoid a circular import from constants → preregister).
 */
function norm(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62") && digits.length >= 11) return `0${digits.slice(2)}`;
  if (digits.startsWith("0")) return digits;
  if (digits.length >= 9 && digits[0] === "8") return `0${digits}`;
  return digits;
}

const ADMIN_NORM = norm(ADMIN_PHONE);
const DEVOTION_ADMIN_NORM = norm(DEVOTION_ADMIN_PHONE);

export function isAnyAdmin(phone: string): boolean {
  const n = norm(phone);
  return n === ADMIN_NORM || n === DEVOTION_ADMIN_NORM;
}

export function isDevotionAdmin(phone: string): boolean {
  const n = norm(phone);
  return n === ADMIN_NORM || n === DEVOTION_ADMIN_NORM;
}

export function isFirmanAdmin(phone: string): boolean {
  return norm(phone) === ADMIN_NORM;
}

/**
 * Ranting list sourced exclusively from NEXT_PUBLIC_RANTING_LIST in .env.local.
 * Format: comma-separated, e.g. NEXT_PUBLIC_RANTING_LIST=A,B,C
 * Returns [] when the env var is unset — the login dropdown is hidden in that case.
 */
export function getRantingList(): string[] {
  const raw = process.env.NEXT_PUBLIC_RANTING_LIST?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}
