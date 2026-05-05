"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { GBack, GCheck, GChevronR, GWhatsApp } from "@/components/ui/Glyphs";
import type { StoredProfile } from "@/types";

interface MemberStatus {
  phone: string;
  name: string;
  submitted_today: boolean;
}

function avatarInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { profile?: StoredProfile }) : null;
      const p = parsed?.profile ?? null;
      if (!p?.is_coordinator) { router.replace("/"); return; }
      setProfile(p);
    } catch {
      router.replace("/");
    } finally {
      setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    if (!authChecked || !profile?.is_coordinator) return;
    const phone = encodeURIComponent(profile.phone);
    const rantingParam = encodeURIComponent(profile.coordinator_ranting ?? "");
    void fetch(`/api/coordinator/members?phone=${phone}&ranting=${rantingParam}`)
      .then((r) => r.json())
      .then((d: { ranting?: string; members?: MemberStatus[] }) => {
        setRanting(d.ranting ?? "");
        setMembers(d.members ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authChecked, profile]);

  const notSubmitted = members.filter((m) => !m.submitted_today);
  const submitted = members.filter((m) => m.submitted_today);

  if (!authChecked) return null;

  return (
    <div style={{ minHeight: 'min(100dvh, 880px)', background: 'var(--color-bg-page)', position: 'relative' }}>
      <div className="vq-grain" />

      {/* Header */}
      <div className="vq-header">
        <div className="vq-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => router.back()}
              className="vq-tap"
              aria-label={m.coordinatorBackAria}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              <GBack size={22} />
            </button>
            <div>
              <div className="vq-title">{m.coordinatorTitle}</div>
              {ranting && (
                <div className="vq-subtitle">{ranting}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px var(--space-page-x) 100px', position: 'relative' }}>
        {loading ? (
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: 32 }}>
            {m.coordinatorLoading}
          </p>
        ) : (
          <>
            {/* Summary counts */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <div style={{
                flex: 1, padding: 12, borderRadius: 12,
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-danger-text)', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.85 }}>
                  Belum Submit
                </div>
                <div className="vq-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-danger-text)', marginTop: 2 }}>
                  {notSubmitted.length}
                </div>
              </div>
              <div style={{
                flex: 1, padding: 12, borderRadius: 12,
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success-text)', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.85 }}>
                  Sudah Submit
                </div>
                <div className="vq-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-success-text)', marginTop: 2 }}>
                  {submitted.length}
                </div>
              </div>
            </div>

            {/* Not submitted */}
            {notSubmitted.length === 0 ? (
              <div className="vq-card" style={{
                background: 'var(--color-success-bg)',
                borderColor: 'var(--color-success-border)',
                textAlign: 'center', padding: 24, marginBottom: 18,
              }}>
                <div style={{
                  width: 48, height: 48, margin: '0 auto 10px', borderRadius: '50%',
                  background: 'var(--color-success-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <GCheck size={26} stroke={2.5} color="var(--color-success-text)" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-display)' }}>
                  {m.coordinatorAllDone}
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Sapa lewat WhatsApp
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {notSubmitted.map((member) => (
                    <div
                      key={member.phone || member.name}
                      className="vq-card"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}
                    >
                      <div className="vq-avatar">{avatarInitials(member.name)}</div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{member.name}</div>
                      <a
                        href={buildWhatsAppLink(member.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vq-tap"
                        aria-label={`WhatsApp ${member.name}`}
                        style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'var(--color-wa-green)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                      >
                        <GWhatsApp size={18} color="#fff" />
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Submitted — collapsible */}
            <button
              type="button"
              onClick={() => setDoneOpen((v) => !v)}
              className="vq-tap"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 'none', padding: '10px 4px', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
                color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)',
              }}
            >
              <span>Sudah submit ({submitted.length})</span>
              <span style={{ transform: doneOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                <GChevronR size={14} />
              </span>
            </button>
            {doneOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {submitted.map((member) => (
                  <div key={member.phone || member.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 12,
                    background: 'var(--color-bg-muted)', opacity: 0.75,
                  }}>
                    <GCheck size={16} stroke={2.5} color="var(--color-success-text)" />
                    <span style={{ fontSize: 13.5, color: 'var(--color-text-secondary)' }}>{member.name}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
