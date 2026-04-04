import { NextRequest, NextResponse } from "next/server";
import { messages, type Locale } from "@/lib/i18n";
import { lookupPreregisteredName } from "@/lib/google-sheets/preregister-sheet";
import { normalizePhone } from "@/lib/preregister";
import { isAnyAdmin } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * POST /api/auth/login
 * Same contract as /api/preregister-lookup — kept as a dedicated auth endpoint
 * so client code can target a semantically clear URL.
 */
export async function POST(req: NextRequest) {
  let body: { phone?: string; month?: number; locale?: Locale; ranting?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const locale: Locale = body.locale === "id" ? "id" : "en";
  const m = messages[locale];
  const phoneInput = body.phone ?? "";
  const ranting = typeof body.ranting === "string" ? body.ranting.trim() : undefined;
  const month =
    typeof body.month === "number" && Number.isFinite(body.month)
      ? body.month
      : new Date().getMonth() + 1;

  const phone = normalizePhone(phoneInput);
  if (!phone || phone.length < 10) {
    return NextResponse.json({ ok: false, error: m.errPhoneInvalid });
  }

  // Admin phones bypass the sheet lookup.
  if (isAnyAdmin(phone)) {
    return NextResponse.json({ ok: true, canonicalPhone: phone, name: "Admin" });
  }

  try {
    const name = await lookupPreregisteredName(phone, month, ranting);
    if (!name) {
      return NextResponse.json({ ok: false, error: m.errPhoneNotInvited });
    }
    return NextResponse.json({ ok: true, canonicalPhone: phone, name: name.trim() });
  } catch {
    return NextResponse.json({ ok: false, error: m.loginErrorGeneric }, { status: 502 });
  }
}
