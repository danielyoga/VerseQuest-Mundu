"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type StoredProfile = { name: string; ranting?: string };

function readProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { profile?: StoredProfile }) : null;
    return parsed?.profile?.name ? parsed.profile : null;
  } catch {
    return null;
  }
}

export function CreatePrayerModal({ isOpen, onClose, onSuccess }: Props) {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const { locale } = useLocale();
  const m = messages[locale];
  const [prayerText, setPrayerText] = useState("");
  const [showName, setShowName] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [portalReady, setPortalReady] = useState(false);

  useLayoutEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset state and read fresh profile each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setProfile(readProfile());
      setPrayerText("");
      setShowName(true);
      setSaving(false);
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/prayer-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile?.name ?? "",
          ranting: profile?.ranting ?? "",
          prayer_request: prayerText,
          show_name: showName,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError(m.prayerWallErrNetwork);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !portalReady) return null;

  const canSubmit = prayerText.trim().length >= 10 && !saving;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50"
      style={{ minHeight: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prayer-modal-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[390px] flex-col rounded-t-[24px] bg-[var(--vq-bg)] pb-[env(safe-area-inset-bottom)] shadow-xl"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--vq-border)]" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--vq-border)] px-5 py-4">
          <h2
            id="prayer-modal-title"
            className="text-[17px] font-semibold text-[var(--vq-text)]"
          >
            {m.prayerWallModalTitle}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--vq-muted)] hover:bg-[var(--vq-canvas)]"
            aria-label={m.modalClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Textarea */}
          <div>
            <label
              htmlFor="prayer-text"
              className="mb-1.5 block text-sm font-medium text-[var(--vq-text)]"
            >
              {m.prayerWallLabel} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="prayer-text"
              value={prayerText}
              onChange={(e) => setPrayerText(e.target.value)}
              placeholder={m.prayerWallPlaceholder}
              maxLength={500}
              rows={5}
              className="w-full resize-none rounded-xl border border-[var(--vq-border)] bg-[var(--vq-canvas)] px-3 py-2.5 text-[14px] text-[var(--vq-text)] placeholder:text-[var(--vq-muted)] focus:outline-none focus:ring-2 focus:ring-[#534AB7]/40"
            />
            <p className="mt-1 text-right text-xs text-[var(--vq-muted)]">
              {prayerText.length} / 500
            </p>
          </div>

          {/* Show name toggle */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--vq-text)]">
                {m.prayerWallShowName}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showName}
                onClick={() => setShowName((v) => !v)}
                className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors ${
                  showName ? "bg-[#534AB7]" : "bg-[var(--vq-border)]"
                }`}
              >
                <span
                  className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    showName ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {profile?.name && (
              <p className="mt-1 text-sm text-[var(--vq-muted)]">{profile.name}</p>
            )}
            <p className="mt-2 text-xs text-[var(--vq-muted)]">
              {showName ? m.prayerWallShowNameHint : m.prayerWallAnonHint}
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[var(--vq-border)] px-5 py-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl py-3 text-[15px] font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: "#534AB7" }}
          >
            {saving ? m.prayerWallSubmitting : m.prayerWallSubmit}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
