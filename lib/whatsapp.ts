// const WA_MESSAGE = encodeURIComponent(
const WA_MESSAGE = "Yukk, jangan lupa submit Bible Read hari ini ya, sekalian polling-nya juga";

/**
 * Builds a wa.me deep link for a given member phone number.
 *
 * Sheet phones may be stored without country code (e.g. "81334080077").
 * wa.me requires full E.164 without + (e.g. "6281334080077").
 *
 * Normalization:
 *   starts with +  → strip +
 *   starts with 0  → replace 0 with 62
 *   starts with 8  → prepend 62
 *   starts with 62 → use as-is
 */
export function buildWhatsAppLink(rawPhone: string): string {
  let normalized = rawPhone.trim().replace(/\s+/g, "").replace(/^\+/, "");

  if (normalized.startsWith("0")) {
    normalized = "62" + normalized.slice(1);
  } else if (normalized.startsWith("8")) {
    normalized = "62" + normalized;
  }

  return `https://wa.me/${normalized}?text=${WA_MESSAGE}`;
}
