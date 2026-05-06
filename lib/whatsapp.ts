const WA_TEXT = "Yukk, jangan lupa submit Bible Read hari ini ya, sekalian polling-nya juga.\nSegera klik : https://bit.ly/BIBLEREADBIFA\nGod bless you 🙏 😇";

/**
 * Builds a WhatsApp deep link for a given member phone number.
 *
 * Sheet phones may be stored without country code (e.g. "81334080077").
 * The API requires full E.164 without + (e.g. "6281334080077").
 *
 * Normalization:
 *   starts with +  → strip +
 *   starts with 0  → replace 0 with 62
 *   starts with 8  → prepend 62
 *   starts with 62 → use as-is
 */
function normalizePhone(rawPhone: string): string {
  let n = rawPhone.trim().replace(/\s+/g, "").replace(/^\+/, "");
  if      (n.startsWith("0")) n = "62" + n.slice(1);
  else if (n.startsWith("8")) n = "62" + n;
  return n;
}

export function buildWhatsAppLink(rawPhone: string): string {
  const encodedText = encodeURIComponent(WA_TEXT).replace(/%20/g, "+");
  return `https://api.whatsapp.com/send/?phone=${normalizePhone(rawPhone)}&text=${encodedText}&type=phone_number&app_absent=0`;
}

/** Personalized reminder link for a single member (PRD-005 §5.4). */
export function buildPersonalReminderLink(rawPhone: string, name: string): string {
  const firstName   = name.split(" ")[0] ?? name;
  const text        = `Halo ${firstName}! 👋 Mengingatkan untuk submit firman hari ini. Tuhan menyertaimu! 🙏`;
  const encodedText = encodeURIComponent(text).replace(/%20/g, "+");
  return `https://api.whatsapp.com/send/?phone=${normalizePhone(rawPhone)}&text=${encodedText}&type=phone_number&app_absent=0`;
}
