"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { isDevotionAdmin } from "@/lib/constants";
import { useLocale } from "@/contexts/LocaleContext";
import { messages, type Locale } from "@/lib/i18n";
import { toLocalDateString } from "@/lib/date-utils";
import { PRAYER_MAX_CHARS, sanitizePrayerText, validatePrayerText } from "@/lib/prayer-content";
import { AdminTabs } from "@/components/admin/AdminTabs";

const DAYS_BACK = 7;
const DAYS_AHEAD = 14;
/** Empty days from today through today+6 are highlighted. */
const HIGHLIGHT_DAYS = 7;

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(locale: Locale, s: string, long: boolean): string {
  return new Intl.DateTimeFormat(
    locale === "id" ? "id-ID" : "en-US",
    long
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : { weekday: "short", day: "numeric", month: "short" }
  ).format(parseLocalDate(s));
}

type SaveMsg = { ok: boolean; text: string } | null;

export default function AdminPrayerPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const m = messages[locale];

  const [phone, setPhone] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [today, setToday] = useState<string | null>(null);

  // Saved prayers by date (null while loading)
  const [prayers, setPrayers] = useState<Record<string, string> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  const [selected, setSelected] = useState<string | null>(null);
  // Unsaved edits by date, so switching days never loses typing
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<SaveMsg>(null);
  const editorRef = useRef<HTMLElement>(null);

  // Auth guard — read phone from existing localStorage profile (same as the devotion editor)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { profile?: { phone?: string } }) : null;
      const p = parsed?.profile?.phone ?? null;
      setPhone(p);
      if (!p || !isDevotionAdmin(p)) {
        router.replace("/");
      }
    } catch {
      router.replace("/");
    } finally {
      const t = toLocalDateString(new Date());
      setToday(t);
      setSelected(t);
      setAuthChecked(true);
    }
  }, [router]);

  const days = useMemo(() => {
    if (!today) return [];
    const base = parseLocalDate(today);
    return Array.from({ length: DAYS_BACK + 1 + DAYS_AHEAD }, (_, i) =>
      toLocalDateString(
        new Date(base.getFullYear(), base.getMonth(), base.getDate() + i - DAYS_BACK)
      )
    );
  }, [today]);

  useEffect(() => {
    if (!authChecked || !phone || !isDevotionAdmin(phone) || days.length === 0) return;
    let cancelled = false;
    const qs = new URLSearchParams({ phone, from: days[0], to: days[days.length - 1] });
    fetch(`/api/admin/prayer?${qs.toString()}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()) as { prayers: Record<string, string> };
      })
      .then((d) => {
        if (cancelled) return;
        setPrayers(d.prayers);
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authChecked, phone, days, loadKey]);

  function selectDate(date: string) {
    setSelected(date);
    setSaveMsg(null);
    // On one-column layouts the editor sits above the list: bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      editorRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  const saved = selected && prayers ? (prayers[selected] ?? "") : "";
  const draft = selected ? (drafts[selected] ?? saved) : "";
  const preview = sanitizePrayerText(draft);
  const checked = validatePrayerText(draft);
  const tooLong = !checked.ok && checked.error === "too_long";
  const dirty = preview !== saved;
  const canSave = checked.ok && dirty && !saving && prayers !== null;

  async function handleSave() {
    if (!phone || !selected || !checked.ok) return;
    const date = selected;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/admin/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, date, text: draft }),
      });
      const data = (await res.json()) as { success?: boolean; text?: string; error?: string };
      if (res.ok && data.success) {
        const text = data.text ?? checked.text;
        setPrayers((prev) => ({ ...(prev ?? {}), [date]: text }));
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[date];
          return next;
        });
        setSaveMsg({ ok: true, text: m.adminSaved });
      } else {
        setSaveMsg({ ok: false, text: data.error ?? m.adminSaveFailed });
      }
    } catch {
      setSaveMsg({ ok: false, text: m.adminSaveError });
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vq-canvas)] text-[var(--vq-muted)]">
        {m.loading}
      </div>
    );
  }

  if (!phone || !isDevotionAdmin(phone) || !today || !selected) return null;

  const soonEnd = days[DAYS_BACK + HIGHLIGHT_DAYS - 1];
  const isSoon = (d: string) => d >= today && d <= soonEnd;
  const emptySoon = prayers ? days.filter((d) => isSoon(d) && !prayers[d]).length : 0;

  return (
    <div className="min-h-screen bg-[var(--vq-canvas)] px-4 pb-32 pt-8 sm:px-[50px]">
      <div className="mx-auto w-full max-w-[1040px]">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--vq-muted)] hover:bg-[var(--vq-bg-2)]"
            aria-label={m.adminBackAria}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M11 14l-5-5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-[var(--vq-text)]">{m.adminPrayerTitle}</h1>
        </div>

        <AdminTabs />

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          {/* Editor — first on phones, right column on desktop */}
          <section
            ref={editorRef}
            className="order-1 scroll-mt-4 rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-5 lg:sticky lg:top-6 lg:order-2"
          >
            <h2 className="mb-3 text-[15px] font-semibold text-[var(--vq-text)]">
              <label htmlFor="prayer-text">
                {m.adminPrayerEditorHeading(formatDate(locale, selected, true))}
              </label>
            </h2>
            <textarea
              id="prayer-text"
              value={draft}
              onChange={(e) => {
                const value = e.target.value;
                setDrafts((prev) => ({ ...prev, [selected]: value }));
                setSaveMsg(null);
              }}
              rows={7}
              placeholder={m.adminPrayerPlaceholder}
              aria-invalid={tooLong}
              aria-describedby="prayer-count"
              className="w-full resize-y rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-base leading-relaxed text-[var(--vq-text)] placeholder:text-[var(--vq-muted-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#534AB7]/40"
            />
            <div className="mt-1.5 flex items-start justify-between gap-3 text-[11px]">
              <span className="text-red-700">{tooLong ? m.adminPrayerTooLong(PRAYER_MAX_CHARS) : ""}</span>
              <span
                id="prayer-count"
                className={`tabular-nums ${tooLong ? "font-semibold text-red-700" : "text-[var(--vq-muted-2)]"}`}
              >
                {preview.length} / {PRAYER_MAX_CHARS}
              </span>
            </div>

            {/* Preview at the prayer page's size */}
            <p className="mb-2 mt-5 text-[12px] font-medium uppercase tracking-wide text-[var(--vq-muted)]">
              {m.adminPrayerPreview}
            </p>
            <div className="mx-auto max-w-[390px] rounded-[var(--vq-radius-lg)] border border-[var(--vq-border)] bg-[var(--vq-bg-2)] px-7 py-8">
              <div className="flex flex-col items-center gap-5 text-center">
                <div aria-hidden className="h-[2px] w-10 rounded-sm bg-[#534AB7]" />
                <p
                  className={`m-0 whitespace-pre-line text-[24px] font-medium leading-[1.6] [overflow-wrap:anywhere] [text-wrap:pretty] ${
                    preview ? "text-[var(--vq-text)]" : "text-[var(--vq-muted-2)]"
                  }`}
                >
                  {preview || m.adminPrayerPlaceholder}
                </p>
                <div aria-hidden className="h-[2px] w-10 rounded-sm bg-[#534AB7]" />
              </div>
            </div>

            {saveMsg && (
              <p
                role="status"
                className={`mt-4 rounded-lg px-3 py-2 text-[13px] ${saveMsg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
              >
                {saveMsg.text}
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave}
              className="mt-4 w-full min-h-[52px] rounded-2xl bg-[#534AB7] py-4 text-base font-medium text-white transition hover:bg-[#3C3489] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[var(--vq-bg-2)] disabled:text-[var(--vq-muted-2)]"
            >
              {saving ? m.adminSaving : saved ? m.adminUpdateButton : m.adminSaveButton}
            </button>
          </section>

          {/* Day list */}
          <section className="order-2 rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-5 lg:order-1">
            <h2 className="mb-3 text-[15px] font-semibold text-[var(--vq-text)]">{m.adminPrayerListHeading}</h2>

            {loadError ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5">
                <p className="text-[13px] text-red-800">{m.adminPrayerLoadError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoadError(false);
                    setLoadKey((k) => k + 1);
                  }}
                  className="shrink-0 rounded-lg bg-[#534AB7] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#3C3489]"
                >
                  {m.adminPrayerRetry}
                </button>
              </div>
            ) : !prayers ? (
              <p className="py-6 text-center text-sm text-[var(--vq-muted)]">{m.loading}</p>
            ) : (
              <>
                <p
                  className={`mb-3 rounded-lg px-3 py-2 text-[13px] font-medium ${
                    emptySoon > 0 ? "bg-[#FAEEDA] text-[#633806]" : "bg-[#EAF3DE] text-[#27500A]"
                  }`}
                >
                  {emptySoon > 0 ? m.adminPrayerEmptySoon(emptySoon) : m.adminPrayerAllFilled}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {days.map((d) => {
                    const text = prayers[d];
                    const filled = Boolean(text);
                    const flagged = !filled && isSoon(d);
                    const isSelected = d === selected;
                    return (
                      <li key={d}>
                        <button
                          type="button"
                          onClick={() => selectDate(d)}
                          aria-pressed={isSelected}
                          className={`flex w-full items-center gap-3 rounded-[var(--vq-radius-md)] border px-3 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "border-[#534AB7] bg-[#EEEDFE]"
                              : flagged
                                ? "border-[#E8D4A8] bg-[#FAEEDA]/60 hover:bg-[#FAEEDA]"
                                : "border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] hover:bg-[var(--vq-bg)]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 text-[14px] font-medium">
                              <span className={`capitalize ${d < today ? "text-[var(--vq-muted)]" : "text-[var(--vq-text)]"}`}>
                                {formatDate(locale, d, false)}
                              </span>
                              {d === today && (
                                <span className="rounded-full bg-[#534AB7] px-2 py-0.5 text-[10px] font-semibold text-white">
                                  {m.adminPrayerToday}
                                </span>
                              )}
                              {drafts[d] !== undefined && sanitizePrayerText(drafts[d]) !== (text ?? "") && (
                                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#534AB7]" />
                              )}
                            </p>
                            {filled && (
                              <p className="mt-0.5 truncate text-[12px] text-[var(--vq-muted)]">{text}</p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              filled
                                ? "bg-[#EAF3DE] text-[#27500A]"
                                : flagged
                                  ? "bg-[#FAEEDA] text-[#633806]"
                                  : "bg-[var(--vq-bg)] text-[var(--vq-muted)]"
                            }`}
                          >
                            {filled ? m.adminPrayerFilled : m.adminPrayerEmpty}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
