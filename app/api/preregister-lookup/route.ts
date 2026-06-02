import { NextRequest, NextResponse } from "next/server";
import { messages, type Locale } from "@/lib/i18n";
import { lookupPreregisteredName } from "@/lib/google-sheets/preregister-sheet";
import { normalizePhone } from "@/lib/preregister";
import { isAnyAdmin } from "@/lib/constants";
import { isCoordinator, getCoordinatorRanting, isCoordinatorForRanting } from "@/lib/coordinators";

export const runtime = "nodejs";

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

  const resolveCoordinatorRanting = (phone: string, preferredRanting?: string): string | null => {
    if (preferredRanting && isCoordinatorForRanting(phone, preferredRanting)) {
      return preferredRanting;
    }
    return getCoordinatorRanting(phone);
  };

  // Admin phones bypass the sheet lookup — they are always allowed in.
  if (isAnyAdmin(phone)) {
    return NextResponse.json({
      ok: true,
      canonicalPhone: phone,
      name: "Admin",
      is_coordinator: isCoordinator(phone),
      coordinator_ranting: resolveCoordinatorRanting(phone, ranting),
    });
  }

  try {
    const found = await lookupPreregisteredName(phone, month, ranting);
    if (!found) {
      return NextResponse.json({ ok: false, error: m.errPhoneNotInvited });
    }
    const resolvedRanting = found.ranting ?? ranting;
    return NextResponse.json({
      ok: true,
      canonicalPhone: phone,
      name: found.name.trim(),
      ...(resolvedRanting ? { ranting: resolvedRanting } : {}),
      is_coordinator: isCoordinator(phone),
      coordinator_ranting: resolveCoordinatorRanting(phone, resolvedRanting),
    });
  } catch {
    return NextResponse.json({ ok: false, error: m.loginErrorGeneric }, { status: 502 });
  }
}
