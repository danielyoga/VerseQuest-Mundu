import registry from "@/data/preregistered-users.json";
import { id } from "@/lib/i18n-id";

type Registry = Record<string, string>;

const R = registry as Registry;

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

/** Look up preregistered user by phone only; name comes from the registry. */
export function validatePreregistration(
  phoneInput: string
): { ok: true; canonicalPhone: string; name: string } | { ok: false; error: string } {
  const phone = normalizePhone(phoneInput);
  if (!phone || phone.length < 10) {
    return { ok: false, error: id.errPhoneInvalid };
  }

  const registeredName = R[phone];
  if (!registeredName) {
    return {
      ok: false,
      error: id.errPhoneNotInvited,
    };
  }

  return { ok: true, canonicalPhone: phone, name: registeredName.trim() };
}
