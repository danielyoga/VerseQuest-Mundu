"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import type { StoredProfile } from "@/types";

interface MemberStatus {
  phone: string;
  name: string;
  submitted_today: boolean;
}

function MemberCard({ member }: { member: MemberStatus }) {
  const waLink = buildWhatsAppLink(member.phone);
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--vq-border)] bg-[var(--vq-bg)] px-4 py-3 mb-2">
      <span className="text-sm font-semibold text-[var(--vq-text)]">{member.name}</span>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] transition-transform active:scale-95"
      >
        <img src="/whatsapp-icon.svg" alt="" aria-hidden width={22} height={22} />
      </a>
    </div>
  );
}

function MemberCardDone({ member }: { member: MemberStatus }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--vq-border)] bg-[var(--vq-bg-2)] px-4 py-3 mb-2 opacity-60">
      <span className="font-bold text-[#22c55e]">✓</span>
      <span className="text-sm text-[var(--vq-muted)]">{member.name}</span>
    </div>
  );
}

export default function CoordinatorPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const m = messages[locale];
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [members, setMembers] = useState<MemberStatus[]>([]);
  const [ranting, setRanting] = useState("");
  const [loading, setLoading] = useState(true);
  const [doneOpen, setDoneOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    try {
      const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { profile?: StoredProfile }) : null;
      const p = parsed?.profile ?? null;
      if (!p?.is_coordinator) {
        router.replace("/");
        return;
      }
      setProfile(p);
    } catch {
      router.replace("/");
    } finally {
      setAuthChecked(true);
    }
  }, [router]);

  // Fetch members
  useEffect(() => {
    if (!authChecked || !profile?.is_coordinator) return;
    const phone = encodeURIComponent(profile.phone);
    const ranting = encodeURIComponent(profile.coordinator_ranting ?? "");
    void fetch(`/api/coordinator/members?phone=${phone}&ranting=${ranting}`)
      .then((r) => r.json())
      .then((d: { ranting?: string; members?: MemberStatus[] }) => {
        setRanting(d.ranting ?? "");
        setMembers(d.members ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authChecked, profile]);

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const notSubmitted = members.filter((m) => !m.submitted_today);
  const submitted = members.filter((m) => m.submitted_today);

  if (!authChecked) return null;

  return (
    <div className="px-4 pt-8">
      <div className="mx-auto max-w-[390px]">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--vq-muted)] hover:bg-[var(--vq-bg-2)]"
              aria-label={m.coordinatorBackAria}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M11 14l-5-5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <h1 className="text-2xl font-medium text-[var(--vq-text)]">{m.coordinatorTitle}</h1>
          {ranting && (
            <p className="mt-1 text-[13px] text-[var(--vq-muted)]">
              {ranting} · {dateLabel}
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-center text-[var(--vq-muted)]">{m.coordinatorLoading}</p>
        ) : (
          <>
            {/* Not submitted */}
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--vq-muted)]">
              {m.coordinatorNotSubmitted(notSubmitted.length)}
            </p>
            {notSubmitted.length === 0 ? (
              <p className="mb-4 rounded-xl border border-[var(--vq-border)] bg-[var(--vq-bg)] px-4 py-3 text-sm text-[var(--vq-muted)]">
                {m.coordinatorAllDone}
              </p>
            ) : (
              <div className="mb-4">
                {notSubmitted.map((m) => (
                  <MemberCard key={m.phone || m.name} member={m} />
                ))}
              </div>
            )}

            {/* Submitted — collapsible */}
            <button
              type="button"
              onClick={() => setDoneOpen((v) => !v)}
              className="mb-2 flex w-full items-center justify-between text-[13px] font-semibold uppercase tracking-wide text-[var(--vq-muted)]"
            >
              {/* <span>{m.coordinatorSubmitted(submitted.length)}</span> */}
              <span>{doneOpen ? "▴" : "▾"}</span>
            </button>
            {doneOpen && (
              <div>
                {submitted.map((m) => (
                  <MemberCardDone key={m.phone || m.name} member={m} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
