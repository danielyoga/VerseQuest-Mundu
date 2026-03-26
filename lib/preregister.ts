/** Normalize Indonesian numbers for lookup (0xxxxxxxxxx, +62, 62, 8xx…). */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62") && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith("0")) {
    return digits;
  }
  if (digits.length >= 9 && digits[0] === "8") {
    return `0${digits}`;
  }
  return digits;
}

/**
 * Digits for the "+62 | …" field: canonical local form without the leading 0
 * (matches placeholder 81234567890). Run after blur or when fixing pasted input.
 */
export function normalizePhoneDraftForDisplay(input: string): string {
  const n = normalizePhone(input);
  if (!n) return "";
  if (n.startsWith("0") && n.length >= 10) return n.slice(1);
  return n.replace(/\D/g, "");
}
