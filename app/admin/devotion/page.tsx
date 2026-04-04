"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { isDevotionAdmin } from "@/lib/constants";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";

export default function AdminDevotionPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const m = messages[locale];

  const [phone, setPhone] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [devotionTitle, setDevotionTitle] = useState("");
  const [devotion, setDevotion] = useState("");
  const [reflections, setReflections] = useState(["", "", ""]);
  const [mode, setMode] = useState<"new" | "edit">("new");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Auth guard — read phone from existing localStorage profile
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
      setAuthChecked(true);
    }
  }, [router]);

  // Load today's existing data
  useEffect(() => {
    if (!authChecked || !phone || !isDevotionAdmin(phone)) return;
    void fetch("/api/devotion/today", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { devotion?: string | null; devotionTitle?: string | null; reflection?: string[] }) => {
        if (d.devotion) {
          setDevotion(d.devotion);
          setMode("edit");
        }
        if (d.devotionTitle) {
          setDevotionTitle(d.devotionTitle);
        }
        if (d.reflection && d.reflection.length > 0) {
          setReflections(d.reflection);
        }
      });
  }, [authChecked, phone]);

  const addReflection = () => setReflections((prev) => [...prev, ""]);
  const deleteReflection = (i: number) => {
    if (reflections.length <= 1) return;
    setReflections((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateReflection = (i: number, val: string) =>
    setReflections((prev) => prev.map((r, idx) => (idx === i ? val : r)));

  async function handleSave() {
    if (!phone) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/devotion/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          devotionTitle,
          devotion,
          reflection: reflections.filter((r) => r.trim() !== ""),
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        setMode("edit");
        setSaveMsg(m.adminSaved);
      } else {
        setSaveMsg(data.error ?? m.adminSaveFailed);
      }
    } catch {
      setSaveMsg(m.adminSaveError);
    } finally {
      setSaving(false);
    }
  }

  const canSave = devotion.trim().length >= 50 && !saving;

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vq-canvas)] text-[var(--vq-muted)]">
        {m.loading}
      </div>
    );
  }

  if (!phone || !isDevotionAdmin(phone)) return null;

  return (
    <div className="min-h-screen bg-[var(--vq-canvas)] px-4 pb-32 pt-8">
      <div className="mx-auto max-w-[390px]">
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
          <h1 className="text-xl font-semibold text-[var(--vq-text)]">{m.adminDevotionTitle}</h1>
        </div>

        {/* Devotion section */}
        <div className="mb-5 rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--vq-text)]">{m.adminDevotionSection}</h2>
          <label className="mb-1 block text-[13px] font-medium text-[var(--vq-muted)]">
            {m.adminDevotionTitleLabel}
          </label>
          <input
            type="text"
            value={devotionTitle}
            onChange={(e) => setDevotionTitle(e.target.value)}
            maxLength={200}
            placeholder={m.adminDevotionTitlePlaceholder}
            className="mb-4 min-h-[44px] w-full rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-2.5 text-base text-[var(--vq-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#534AB7]/40"
          />
          <textarea
            value={devotion}
            onChange={(e) => setDevotion(e.target.value)}
            maxLength={3000}
            className="w-full resize-none rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] p-3.5 text-base text-[var(--vq-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#534AB7]/40"
            style={{ minHeight: 160 }}
          />
          <p className="mt-1.5 text-right text-[11px] text-[var(--vq-muted-2)]">
            {devotion.length} / 3000
          </p>
          {devotion.trim().length < 50 && devotion.length > 0 && (
            <p className="mt-1 text-[11px] text-amber-700">{m.adminDevotionMinLength}</p>
          )}
        </div>

        {/* Reflection section */}
        <div className="mb-5 rounded-[var(--vq-radius-xl)] border border-[var(--vq-border)] bg-[var(--vq-bg)] p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--vq-text)]">{m.adminReflectionSection}</h2>
          <div className="space-y-2.5">
            {reflections.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={r}
                  onChange={(e) => updateReflection(i, e.target.value)}
                  placeholder={m.adminReflectionPlaceholder(i + 1)}
                  className="min-h-[44px] flex-1 rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-2.5 text-base text-[var(--vq-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#534AB7]/40"
                />
                {reflections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteReflection(i)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--vq-muted)] hover:bg-red-50 hover:text-red-600 transition-colors"
                    aria-label={m.adminReflectionDeleteAria}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addReflection}
            className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#534AB7] hover:text-[#3C3489]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            {m.adminReflectionAdd}
          </button>
        </div>

        {/* Save button */}
        {saveMsg && (
          <p className={`mb-3 rounded-lg px-3 py-2 text-[13px] ${saveMsg === m.adminSaved ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {saveMsg}
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!canSave}
          className="w-full min-h-[52px] rounded-2xl bg-[#534AB7] py-4 text-base font-medium text-white transition hover:bg-[#3C3489] disabled:cursor-not-allowed disabled:bg-[var(--vq-bg-2)] disabled:text-[var(--vq-muted-2)]"
        >
          {saving ? m.adminSaving : mode === "edit" ? m.adminUpdateButton : m.adminSaveButton}
        </button>
      </div>
    </div>
  );
}
