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
