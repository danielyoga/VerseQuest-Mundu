"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { messages, type Locale } from "@/lib/i18n";
import { CreatePrayerModal } from "@/components/CreatePrayerModal";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { GHeart, GPlus, GSparkle } from "@/components/ui/Glyphs";
import type { Prayer } from "@/app/api/prayer-wall/route";

const LIKES_KEY = "prayer_wall_likes";

function getLikedSet(): Set<number> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedSet(set: Set<number>) {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
  } catch {}
}

function relativeTime(isoString: string, m: (typeof messages)[Locale]): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return m.prayerWallJustNow;
  if (mins < 60) return m.prayerWallMinutesAgo(mins);
  if (hours < 24) return m.prayerWallHoursAgo(hours);
  if (days === 1) return m.prayerWallYesterday;
  return m.prayerWallDaysAgo(days);
}

function avatarInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

export default function PrayerWallPage() {
  const { locale } = useLocale();
  const m = messages[locale];
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [likedSet, setLikedSet] = useState<Set<number>>(new Set());
  const [answering, setAnswering] = useState<number | null>(null);
  const [confirmAnswer, setConfirmAnswer] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [ranting, setRanting] = useState<string | null>(null);

  useEffect(() => {
    setLikedSet(getLikedSet());
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { profile?: { name?: string; ranting?: string } }) : null;
      if (parsed?.profile?.name) setUserName(parsed.profile.name);
      if (parsed?.profile?.ranting) setRanting(parsed.profile.ranting);
    } catch {}
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    void fetch("/api/prayer-wall", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { prayers?: Prayer[] }) => {
        const all = (data.prayers ?? []).filter((p) => !p.answered);
        const own = all.filter((p) => p.real_username === userName);
        const other = all.filter((p) => p.real_username !== userName);
        setPrayers([...own, ...other]);
      })
      .catch(() => setPrayers([]))
      .finally(() => setLoading(false));
  }, [userName]);

  useEffect(() => { refetch(); }, [refetch]);

  const toggleLike = (rowIndex: number) => {
    setLikedSet((prev) => {
      const next = new Set(prev);
      next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex);
      saveLikedSet(next);
      return next;
    });
  };

  const markAnswered = async (prayer: Prayer) => {
    if (!userName) return;
    setAnswering(prayer.rowIndex);
    try {
      const res = await fetch("/api/prayer-wall", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: prayer.rowIndex, username: userName }),
      });
      if (res.ok) { setConfirmAnswer(null); refetch(); }
    } catch {}
    finally { setAnswering(null); }
  };

  return (
    <div style={{ minHeight: 'min(100dvh, 880px)', background: 'var(--color-bg-page)', position: 'relative' }}>
      <div className="vq-grain" />

      {/* Header */}
      <div className="vq-header">
        <div className="vq-header-row">
          <div>
            <div className="vq-title">{m.prayerWallTitle}</div>
            <div className="vq-subtitle">{m.prayerWallSubtitle}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px var(--space-page-x) 100px', position: 'relative' }}>
        {loading ? (
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{m.loading}</p>
        ) : prayers.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 15, lineHeight: 1.6, color: 'var(--color-text-muted)', paddingTop: 48 }}>
            {m.prayerWallEmpty}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prayers.map((prayer, i) => {
              const isOwn = prayer.real_username === userName;
              const isLiked = likedSet.has(prayer.rowIndex);
              const isAnswering = answering === prayer.rowIndex;
              const showConfirm = confirmAnswer === prayer.rowIndex;

              return (
                <div
                  key={`${prayer.rowIndex}-${i}`}
                  className={`vq-card${isOwn ? ' own' : ''}`}
                  style={{ position: 'relative' }}
                >
                  {isOwn && (
                    <span className="vq-badge primary" style={{ position: 'absolute', top: 12, right: 12 }}>
                      {m.prayerWallBadgeOwn}
                    </span>
                  )}

                  {/* Author row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingRight: isOwn ? 70 : 0 }}>
                    <div className="vq-avatar">{avatarInitials(prayer.username)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>{prayer.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {prayer.ranting ? `${prayer.ranting} · ` : ''}{relativeTime(prayer.submitted_at, m)}
                      </div>
                    </div>
                  </div>

                  {/* Prayer text */}
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-body)' }}>{prayer.prayer_request}</p>

                  {/* Footer actions */}
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className={`vq-pill vq-tap${isLiked ? ' active' : ''}`}
                      onClick={() => toggleLike(prayer.rowIndex)}
                      style={{ color: 'var(--color-primary)' }}
                    >
                      <GHeart size={14} filled={isLiked} color="var(--color-primary)" />
                      <span className="lbl">{m.prayerWallAmin}</span>
                    </button>

                    {isOwn && !showConfirm && !prayer.answered && (
                      <button
                        className="vq-pill vq-tap"
                        onClick={() => setConfirmAnswer(prayer.rowIndex)}
                        style={{
                          background: 'var(--color-success-bg)',
                          borderColor: 'var(--color-success-border)',
                          color: 'var(--color-success-text)',
                        }}
                      >
                        <GSparkle size={14} color="var(--color-success-text)" />
                        <span className="lbl">{m.prayerWallMarkAnswered}</span>
                      </button>
                    )}

                    {isOwn && showConfirm && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Tandai terjawab?</span>
                        <button
                          className="vq-pill vq-tap"
                          onClick={() => void markAnswered(prayer)}
                          disabled={isAnswering}
                          style={{ color: 'var(--color-success-text)', borderColor: 'var(--color-success-border)', opacity: isAnswering ? 0.5 : 1 }}
                        >
                          <span className="lbl">{isAnswering ? m.prayerWallMarkAnswering : 'Ya'}</span>
                        </button>
                        <button
                          className="vq-pill vq-tap"
                          onClick={() => setConfirmAnswer(null)}
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <span className="lbl">Batal</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {userName && (
        <button
          className="vq-fab vq-tap"
          onClick={() => setModalOpen(true)}
          aria-label={m.prayerWallAddAria}
        >
          <GPlus color="#fff" size={26} />
        </button>
      )}

      <CreatePrayerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
