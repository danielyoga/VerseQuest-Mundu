import { NextRequest, NextResponse } from "next/server";
import { messages, type Locale } from "@/lib/i18n";
import { lookupPreregisteredName } from "@/lib/google-sheets/preregister-sheet";
import { normalizePhone } from "@/lib/preregister";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { phone?: string; month?: number; locale?: Locale };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const locale: Locale = body.locale === "id" ? "id" : "en";
  const m = messages[locale];
  const phoneInput = body.phone ?? "";
  const month =
    typeof body.month === "number" && Number.isFinite(body.month)
      ? body.month
      : new Date().getMonth() + 1;

  const phone = normalizePhone(phoneInput);
  if (!phone || phone.length < 10) {
    return NextResponse.json({ ok: false, error: m.errPhoneInvalid });
  }

  try {
    const name = await lookupPreregisteredName(phone, month);
    if (!name) {
      return NextResponse.json({ ok: false, error: m.errPhoneNotInvited });
    }
    return NextResponse.json({
      ok: true,
      canonicalPhone: phone,
      name: name.trim(),
    });
  } catch {
    return NextResponse.json({ ok: false, error: m.loginErrorGeneric }, { status: 502 });
  }
}
