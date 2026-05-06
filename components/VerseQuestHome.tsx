"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSettingsButton } from "@/components/AppSettingsButton";
import { FirmanPollModal } from "@/components/FirmanPollModal";
import { GratitudeModal } from "@/components/GratitudeModal";
import { useDisplayOrder } from "@/contexts/DisplayOrderContext";
import { useDisplayPrefs } from "@/contexts/DisplayPrefsContext";
import { useLocale } from "@/contexts/LocaleContext";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { scheduleVerseKey, useTodayScheduleWindow } from "@/hooks/useTodayScheduleWindow";
import { bookDisplayName } from "@/lib/bible/book-names-id";
import { greetingLine, messages } from "@/lib/i18n";
import { clearScheduleWindowCache } from "@/lib/schedule/window-cache";
import { clearSession } from "@/lib/session";
import { getTodayString } from "@/lib/sheetName";
import type { WeekDotState } from "@/lib/streak/streak";
import type { StoredState, VerseSubmission } from "@/types";
import {
  GBook, GBoltSmall, GCheck, GCheckCircle, GChevronR,
  GCross, GFlame, GHeart, GLogout, GSparkle,
} from "@/components/ui/Glyphs";

const WEEK_LABELS = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

function formatShortDate(locale: string, d: Date): string {
  const tag = locale === 'id' ? 'id-ID' : 'en-US';
  const weekday = new Intl.DateTimeFormat(tag, { weekday: 'long' }).format(d);
  const rest = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  return `${weekday} · ${rest}`;
}

// ── CelebrationBanner ─────────────────────────────────────────────────────────
function CelebrationBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{
      margin: '0 var(--space-page-x) 12px',
      background: 'var(--color-gold-light)',
      border: '1px solid var(--color-gold-border)',
      borderRadius: 14,
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'vq-celebration-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>
      <GSparkle size={18} color="var(--color-gold)" />
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-gold-text)', lineHeight: 1.45 }}>
        Harimu lengkap. Tuhan menyertaimu!
      </span>
    </div>
  );
}

// ── StreakHero ────────────────────────────────────────────────────────────────
function StreakHero({ streak, weekDots, density }: { streak: number; weekDots: WeekDotState[]; density: string }) {
  if (density === 'compact') {
    return (
      <div style={{
        margin: '0 var(--space-page-x) 16px',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 14, padding: '10px 14px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--color-primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <GFlame size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="vq-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>hari · streak aktif</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {weekDots.map((s, i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%',
              background: s === 'done' || s === 'today' ? 'var(--color-primary)' : 'transparent',
              border: s === 'today'
                ? '2px solid var(--color-primary)'
                : (s === 'future' || s === 'missed') ? '1.5px dashed var(--color-border)' : 'none',
              boxShadow: s === 'today' ? '0 0 0 2px var(--color-primary-soft)' : 'none',
            }} />
          ))}
        </div>
      </div>
    );
  }

  // Casual / arc variant
  const dots = weekDots.map((s, i) => ({ l: WEEK_LABELS[i] ?? '', s }));
  return (
    <div style={{ margin: '0 var(--space-page-x) 16px' }}>
      <div className="vq-streak-hero">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.8 }}>Streak doamu</div>
            <div className="vq-mono" style={{ fontSize: 56, fontWeight: 700, lineHeight: 0.95, marginTop: 6, letterSpacing: -0.02 }}>{streak}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>hari berturut-turut</div>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(6px)',
          }}>
            <GFlame size={28} color="#FFD27A" />
          </div>
        </div>

        <div style={{
          position: 'relative', marginTop: 14, paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.22)',
          fontSize: 13, lineHeight: 1.5, opacity: 0.92, fontStyle: 'italic',
        }}>
          "Tetap setia tiap pagi — Tuhan menjumpaimu di tempat yang sama."
        </div>

        <div style={{ position: 'relative', marginTop: 14, display: 'flex', gap: 6 }}>
          {dots.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, letterSpacing: 0.4 }}>{d.l}</span>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: d.s === 'done' ? '#fff' : d.s === 'today' ? '#FAC775' : 'rgba(255,255,255,0.18)',
                color: d.s === 'done' ? 'var(--color-primary)' : d.s === 'today' ? '#412402' : 'rgba(255,255,255,0.7)',
              }}>
                {d.s === 'done'
                  ? <GCheck size={13} color="var(--color-primary)" stroke={2.5} />
                  : d.s === 'today' ? '!' : '·'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── QuestCard ─────────────────────────────────────────────────────────────────
function QuestCard({
  icon, title, desc, ctaLabel, done, onAction,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  ctaLabel?: string;
  done: boolean;
  onAction: () => void;
}) {
  return (
    <div className="vq-quest-card vq-card" style={{
      margin: '0 var(--space-page-x) 10px',
      background: done ? 'var(--color-bg-muted)' : 'var(--color-bg-card)',
      opacity: done ? 0.85 : 1,
    }}>
      {/* Compact row (shown at compact density) */}
      <div className="vq-quest-row-compact" style={{ alignItems: 'center', gap: 12 }}>
        <div className="vq-quest-icon" style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'var(--color-primary)' : 'var(--color-primary-soft)',
          color: done ? '#fff' : 'var(--color-primary)',
        }}>
          {done ? <GCheck size={18} stroke={3} color="#fff" /> : icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: done ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            textDecorationLine: done ? 'line-through' : 'none',
            textDecorationColor: done ? 'var(--color-text-muted)' : 'transparent',
            textDecorationThickness: done ? '1.5px' : undefined,
          }}>{title}</div>
          <div style={{
            fontSize: 12, marginTop: 1, fontWeight: done ? 600 : 400,
            color: done ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}>{done ? 'Selesai · +20 XP' : desc}</div>
        </div>
        {done ? (
          <button className="vq-tap" onClick={onAction} aria-label={`Buka kembali ${title}`} style={{
            background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 10,
            padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            color: 'var(--color-text-muted)',
          }}><GChevronR color="var(--color-text-muted)" /></button>
        ) : (
          <button className="vq-tap" onClick={onAction} aria-label={ctaLabel} style={{
            background: 'var(--color-primary)', border: 'none', borderRadius: 10, padding: '8px 10px',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}><GChevronR color="#fff" /></button>
        )}
      </div>

      {/* Regular density row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} className="vq-quest-row-regular">
        <div className="vq-quest-icon" style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--color-primary-soft)', color: 'var(--color-primary)',
        }}>
          {done ? <GCheck size={22} stroke={2.5} color="var(--color-primary)" /> : icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
        {done ? (
          <button className="vq-tap" onClick={onAction} aria-label={`Buka kembali ${title}`} style={{
            background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 10,
            padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            color: 'var(--color-text-muted)', flexShrink: 0,
          }}><GChevronR color="var(--color-text-muted)" /></button>
        ) : (
          <span className="vq-badge soft">Belum</span>
        )}
      </div>
      {!done && (
        <button className="vq-cta vq-quest-cta vq-tap" onClick={onAction} style={{ marginTop: 12 }}>
          {ctaLabel ?? title}
        </button>
      )}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type VerseQuestHomeProps = {
  state: StoredState;
  displayStreak: number;
  weekDots: WeekDotState[];
  submittedToday: boolean;
  moodEmoji: string;
  submitVerse: (payload: Omit<VerseSubmission, "submitted_at">) => { ok: boolean; error?: string };
  firmanConfig: ReturnType<typeof import("@/lib/firman-poll-config").getFirmanPollConfig>;
  firmanPoll: ReturnType<typeof import("@/hooks/useFirmanPoll").useFirmanPoll>;
  gratitudeQuest: ReturnType<typeof import("@/hooks/useGratitudeQuest").useGratitudeQuest>;
  portalReady: boolean;
  devotionAvailable: boolean | null;
};

// ── Main component ────────────────────────────────────────────────────────────
export function VerseQuestHome({
  state,
  displayStreak,
  weekDots,
  submittedToday,
  submitVerse,
  firmanConfig,
  firmanPoll,
  gratitudeQuest,
  portalReady,
  devotionAvailable,
}: VerseQuestHomeProps) {
  const { locale } = useLocale();
  const { displayOrder } = useDisplayOrder();
  const { density } = useDisplayPrefs();
  const m = messages[locale];
  const {
    todaySchedule,
    schedulePassage,
    schedulePassageStatus,
    scheduleVerseSelectedKey,
    setScheduleVerseSelectedKey,
  } = useTodayScheduleWindow();

  const router = useRouter();
  const [successOpen, setSuccessOpen] = useState(false);
  const [firmanOpen, setFirmanOpen] = useState(false);
  const [firmanModalKey, setFirmanModalKey] = useState(0);
  const [gratitudeOpen, setGratitudeOpen] = useState(false);
  const [gratitudeModalKey, setGratitudeModalKey] = useState(0);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const verseSubmitLock = useRef(false);

  const devotionKey = `versequest_devotion_${getTodayString()}`;
  const [devotionRead, setDevotionRead] = useState(false);
  useEffect(() => {
    const check = () => setDevotionRead(localStorage.getItem(devotionKey) === "read");
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [devotionKey]);

  const displayName = state.profile.name || (locale === "id" ? "Anda" : "there");
  const headerDate = useMemo(() => formatShortDate(locale, new Date()), [locale]);
  const greetingText = useMemo(() => greetingLine(locale, displayName, new Date().getHours()), [locale, displayName]);

  const totalQuests = 2 + (firmanConfig ? 1 : 0);
  const doneQuests =
    (submittedToday ? 1 : 0) +
    (devotionRead ? 1 : 0) +
    (firmanConfig && firmanPoll.doneForToday ? 1 : 0);

  const [bannerVisible, setBannerVisible] = useState(false);
  const prevDoneRef = useRef(doneQuests);
  useEffect(() => {
    if (doneQuests >= totalQuests && prevDoneRef.current < totalQuests) {
      setBannerVisible(true);
      const t = setTimeout(() => setBannerVisible(false), 4000);
      prevDoneRef.current = totalQuests;
      return () => clearTimeout(t);
    }
    if (doneQuests < totalQuests) prevDoneRef.current = doneQuests;
  }, [doneQuests, totalQuests]);

  function handleSubmitFromSchedule(row: { chapter: number; verse: number; text: string }) {
    if (!todaySchedule || submittedToday || verseSubmitLock.current) return;
    verseSubmitLock.current = true;
    try {
      const r = submitVerse({
        book: todaySchedule.book,
        chapter: row.chapter,
        verse: row.verse,
        verse_text: row.text.trim(),
      });
      if (!r.ok) {
        window.alert(r.error ?? m.errSubmitGeneric);
        return;
      }
      window.setTimeout(() => setSuccessOpen(true), 200);
    } finally {
      verseSubmitLock.current = false;
    }
  }

  useLayoutEffect(() => {
    if (!successOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [successOpen]);

  function scrollToReading() {
    document.getElementById('reading-anchor')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  // ── Quest section ──
  const questSection = (
    <>
      <div style={{ padding: '0 var(--space-page-x)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          {m.questToday}
        </div>
        <div className="vq-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {doneQuests}/{totalQuests}
        </div>
      </div>

      <div style={{ margin: '0 var(--space-page-x) 14px', height: 6, background: 'var(--color-bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${totalQuests > 0 ? (doneQuests / totalQuests) * 100 : 0}%`,
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
          transition: 'width 0.5s',
        }} />
      </div>

      <QuestCard
        icon={<GCross size={20} color="var(--color-primary)" />}
        title={m.taskTitle}
        desc={submittedToday ? m.taskDescDone : m.taskDescPending}
        ctaLabel="Pilih Ayat"
        done={submittedToday}
        onAction={scrollToReading}
      />

      <QuestCard
        icon={<GBook size={18} color="var(--color-primary)" />}
        title={m.devotionTaskTitle}
        desc={devotionRead
          ? m.devotionTaskDoneDesc
          : devotionAvailable
          ? m.devotionTaskAvailableDesc
          : m.devotionTaskUnavailableDesc}
        ctaLabel="Buka Renungan"
        done={devotionRead}
        onAction={() => router.push("/devotional")}
      />

      {firmanConfig && (
        <QuestCard
          icon={<GCheckCircle size={18} color="var(--color-primary)" />}
          title={m.task2Title}
          ctaLabel="Isi Checklist"
          done={firmanPoll.doneForToday}
          onAction={() => { setFirmanModalKey((k) => k + 1); setFirmanOpen(true); }}
        />
      )}

      <QuestCard
        icon={<GHeart size={18} color="var(--color-primary)" />}
        title={m.taskGratitudeTitle}
        ctaLabel="Tulis Syukur"
        done={gratitudeQuest.doneForToday}
        onAction={() => { setGratitudeModalKey((k) => k + 1); setGratitudeOpen(true); }}
      />
    </>
  );

  // ── Reading schedule section ──
  const readingScheduleSection = (
    <div id="reading-anchor" style={{ margin: '0 var(--space-page-x) 14px' }}>
      <div className="vq-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            {m.scheduleHeading}
          </div>
          <span className="vq-badge soft" style={{ display: 'inline-flex', gap: 4 }}>
            <GBoltSmall size={11} /> +20 XP
          </span>
        </div>

        {schedulePassageStatus === "loading" && (
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{m.scheduleLoadingPassage}</p>
        )}
        {schedulePassageStatus === "no_plan" && (
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{m.scheduleNoPlan}</p>
        )}
        {schedulePassageStatus === "error" && (
          <p style={{ fontSize: 14, color: 'var(--color-danger)' }}>{m.schedulePassageError}</p>
        )}

        {todaySchedule && (schedulePassageStatus === "ok" || schedulePassageStatus === "verses_pending") && (
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              {bookDisplayName(todaySchedule.book, locale)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>{todaySchedule.reading}</div>

            {schedulePassageStatus === "verses_pending" && (
              <p style={{ marginTop: 10, fontSize: 13, color: '#92400e' }}>{m.scheduleVersesPending}</p>
            )}

            {schedulePassageStatus === "ok" && schedulePassage && schedulePassage.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)', maxHeight: 240, overflowY: 'auto' }}>
                <p style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-muted)' }}>
                  {m.scheduleTranslationNote}
                </p>
                {schedulePassage.map((row, i) => {
                  const rowKey = scheduleVerseKey(row);
                  const selected = scheduleVerseSelectedKey === rowKey;
                  return (
                    <div key={`${rowKey}-${i}`} style={{ marginBottom: 4 }}>
                      {(i === 0 || schedulePassage[i - 1]!.chapter !== row.chapter) && (
                        <p style={{ marginBottom: 6, marginTop: i === 0 ? 0 : 8, fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          {m.scheduleChapterHeading(row.chapter)}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setScheduleVerseSelectedKey((k) => (k === rowKey ? null : rowKey))}
                        className="vq-tap"
                        style={{
                          width: '100%', textAlign: 'left',
                          background: selected ? 'var(--color-primary-soft)' : 'transparent',
                          border: '1px solid transparent',
                          borderColor: selected ? 'var(--color-primary-border)' : 'transparent',
                          borderLeft: selected ? '3px solid var(--color-primary)' : '3px solid transparent',
                          borderRadius: 10, padding: '8px 10px',
                          fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-body)',
                          cursor: submittedToday ? 'default' : 'pointer',
                          fontFamily: 'var(--font-body)',
                          transition: 'background 0.15s ease, border-color 0.15s ease',
                        }}
                      >
                        <span className="vq-mono" style={{ color: 'var(--color-primary)', fontWeight: 700, marginRight: 6, fontSize: 12 }}>
                          {row.chapter}:{row.verse}
                        </span>
                        {row.text}
                      </button>
                      {selected && submittedToday && (
                        <div style={{ marginTop: 4, marginLeft: 10 }}>
                          <span className="vq-badge success">
                            <GCheck size={10} stroke={2.5} /> Sudah dipilih ✓
                          </span>
                        </div>
                      )}
                      {selected && !submittedToday && (
                        <button
                          type="button"
                          onClick={() => handleSubmitFromSchedule(row)}
                          className="vq-tap"
                          style={{
                            marginTop: 6, marginLeft: 10,
                            background: 'var(--color-primary)', color: '#fff',
                            border: 'none', borderRadius: 10, padding: '8px 14px',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          <GCheck size={14} color="#fff" stroke={2.5} /> {m.submitVerse}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="vq-app"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-page)', position: 'relative' }}
      data-density={density}
    >
      {/* Header */}
      <div className="vq-header">
        <div className="vq-header-row">
          <div style={{ minWidth: 0 }}>
            <div className="vq-title">
              Verse<span style={{ color: 'var(--color-primary)' }}>Quest</span>
            </div>
            <div className="vq-subtitle">{headerDate}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="vq-id-chip">
              <span className="dot" />
              {displayName} · {state.profile.ranting ?? ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AppSettingsButton />
              <button
                className="vq-tap"
                onClick={() => setSignOutConfirm(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8, padding: '4px 8px',
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                <GLogout size={12} /> Keluar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="vq-scroll" style={{ paddingBottom: 90, paddingTop: 16, position: 'relative' }}>
        <div className="vq-grain" />

        {/* Greeting */}
        <div style={{ padding: '0 var(--space-page-x) 14px', position: 'relative' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
            {greetingText}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {doneQuests >= totalQuests
              ? `Hari ini selesai. Luar biasa, ${displayName}.`
              : doneQuests >= 1
              ? `Sudah ${doneQuests} dari ${totalQuests} misi. Hampir selesai!`
              : displayStreak > 0
              ? `Streak ${displayStreak} hari. Jangan putus hari ini.`
              : 'Hari baru. Mulai dari satu ayat.'}
          </div>
        </div>

        {/* StreakHero — always on top */}
        <StreakHero streak={displayStreak} weekDots={weekDots} density={density} />

        {/* Celebration banner — slides in on completion */}
        <CelebrationBanner visible={bannerVisible} />

        {/* Quest section + reading — order controlled by displayOrder */}
        {displayOrder === 'reading_first' ? (
          <>
            {readingScheduleSection}
            {questSection}
          </>
        ) : (
          <>
            {questSection}
            {readingScheduleSection}
          </>
        )}
      </div>

      {/* Modals */}
      <GratitudeModal
        key={`gratitude-${gratitudeModalKey}`}
        open={gratitudeOpen}
        onClose={() => setGratitudeOpen(false)}
        initialItems={gratitudeQuest.savedItems}
        onSubmit={(items) => { gratitudeQuest.submit(items); setGratitudeOpen(false); }}
      />
      <FirmanPollModal
        key={`firman-${firmanModalKey}`}
        open={firmanOpen}
        onClose={() => setFirmanOpen(false)}
        config={firmanConfig ?? { questions: [] }}
        initialAnswers={firmanPoll.savedAnswers}
        onSubmit={(answers) => { firmanPoll.submit(answers); setFirmanOpen(false); }}
      />

      {/* Sign-out confirmation modal */}
      {signOutConfirm && portalReady && createPortal(
        <div
          className="animate-vq-fade-in"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(20,12,50,0.55)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 16px 24px',
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSignOutConfirm(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 400,
            background: 'var(--color-bg-card)',
            borderRadius: 20, padding: '24px 20px 20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
              Keluar dari akun?
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Progress hari ini tetap tersimpan. Kamu perlu daftar ulang untuk masuk lagi.
            </div>
            <button
              type="button"
              className="vq-tap"
              onClick={() => {
                clearSession();
                localStorage.removeItem(APP_DATA_STORAGE_KEY);
                clearScheduleWindowCache();
                window.location.href = "/";
              }}
              style={{
                width: '100%', minHeight: 48, borderRadius: 14,
                background: 'var(--color-danger, #ef4444)', color: '#fff',
                border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                marginBottom: 10, fontFamily: 'var(--font-body)',
              }}
            >
              Ya, keluar
            </button>
            <button
              type="button"
              className="vq-tap"
              onClick={() => setSignOutConfirm(false)}
              style={{
                width: '100%', minHeight: 48, borderRadius: 14,
                background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              Batal
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Verse submit success overlay */}
      {successOpen && portalReady && createPortal(
        <div
          className="animate-vq-fade-in"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(20,12,50,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 28,
          }}
          onClick={() => setSuccessOpen(false)}
        >
          <div style={{
            width: '100%', maxWidth: 320,
            background: 'var(--color-bg-card)',
            borderRadius: 24, padding: '28px 24px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--color-success-bg)',
              border: '2px solid var(--color-success-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <GCheck size={32} stroke={2.6} color="var(--color-success-text)" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {m.successTitle}
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              {m.successBody(displayName)}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 14, padding: '6px 14px', borderRadius: 999,
              background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 13,
            }}>
              <GBoltSmall size={14} color="#fff" /> {m.successXp}
            </div>
            <button
              type="button"
              onClick={() => setSuccessOpen(false)}
              className="vq-cta vq-tap"
              style={{ marginTop: 18 }}
            >
              {m.successCta}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
