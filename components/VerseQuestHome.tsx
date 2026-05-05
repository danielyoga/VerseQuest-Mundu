"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSettingsButton } from "@/components/AppSettingsButton";
import { FirmanPollModal } from "@/components/FirmanPollModal";
import { GratitudeModal } from "@/components/GratitudeModal";
import { useDisplayOrder } from "@/contexts/DisplayOrderContext";
import { useLocale } from "@/contexts/LocaleContext";
import { scheduleVerseKey, useTodayScheduleWindow } from "@/hooks/useTodayScheduleWindow";
import { bookDisplayName } from "@/lib/bible/book-names-id";
import {
  formatHeaderDate,
  greetingLine,
  messages,
} from "@/lib/i18n";
import { computeLossStreakFromLastSubmit, getMoodMessage } from "@/lib/moodEmoji";
import { getTodayString } from "@/lib/sheetName";
import type { WeekDotState } from "@/lib/streak/streak";
import type { StoredState } from "@/types";
import type { VerseSubmission } from "@/types";
import {
  GBook, GCheck, GCheckCircle, GChevronR, GCross,
  GFlame, GHeart, GLogout, GBoltSmall,
} from "@/components/ui/Glyphs";
import { useDisplayPrefs } from "@/contexts/DisplayPrefsContext";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

type VerseQuestHomeProps = {
  state: StoredState;
  displayStreak: number;
  submittedToday: boolean;
  weekDots: WeekDotState[];
  moodEmoji: string;
  submitVerse: (
    payload: Omit<VerseSubmission, "submitted_at">
  ) => { ok: boolean; error?: string };
  firmanConfig: ReturnType<typeof import("@/lib/firman-poll-config").getFirmanPollConfig>;
  firmanPoll: ReturnType<typeof import("@/hooks/useFirmanPoll").useFirmanPoll>;
  gratitudeQuest: ReturnType<typeof import("@/hooks/useGratitudeQuest").useGratitudeQuest>;
  portalReady: boolean;
  devotionAvailable: boolean | null;
};

// ── Streak hero card (arc variant) ──────────────────────────────────────────
function StreakHero({
  streak,
  weekDots,
  submitted,
  streakText,
  variant = 'arc',
}: {
  streak: number;
  weekDots: WeekDotState[];
  submitted: boolean;
  streakText: string;
  variant?: 'arc' | 'minimal';
}) {
  const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Minimal variant — compact card in both states
  if (variant === 'minimal') {
    return (
      <div style={{
        margin: '0 var(--space-page-x) 16px',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: submitted ? 14 : 18,
        padding: submitted ? '10px 14px' : '18px 18px 14px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', alignItems: submitted ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            {!submitted && (
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Streak</div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: submitted ? 6 : 0 }}>
              <span className="vq-mono" style={{ fontSize: submitted ? 18 : 44, fontWeight: 700, color: 'var(--color-primary)', lineHeight: submitted ? 1 : 0.95, marginTop: submitted ? 0 : 2 }}>{streak}</span>
              {submitted && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>hari · streak aktif</span>}
            </div>
            {!submitted && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, fontStyle: 'italic' }}>hari berturut-turut</div>}
          </div>
          <div style={{ display: 'flex', gap: submitted ? 3 : 4 }}>
            {weekDots.map((dot, i) => (
              submitted ? (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: (dot === 'done' || dot === 'today') ? 'var(--color-primary)' : 'transparent',
                  border: dot === 'today' ? '2px solid var(--color-primary)' : (dot === 'future' || dot === 'missed') ? '1.5px dashed var(--color-border)' : 'none',
                }} />
              ) : (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>{dayLabels[i]?.[0]}</span>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: dot === 'done' ? 'var(--color-primary)' : dot === 'today' ? 'var(--color-primary-soft)' : 'transparent',
                    border: dot === 'today' ? '2px solid var(--color-primary)' : (dot === 'future' || dot === 'missed') ? '1.5px dashed var(--color-border)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {dot === 'done' && <GCheck size={12} color="#fff" stroke={2.5} />}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
        {!submitted && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, fontStyle: 'italic', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
            {streakText}
          </div>
        )}
      </div>
    );
  }

  if (submitted) {
    // Compact strip after submit
    return (
      <div style={{
        margin: '0 var(--space-page-x) 16px',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 14, padding: '10px 14px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--color-primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GFlame size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="vq-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>hari · streak aktif</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {weekDots.map((dot, i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%',
              background: dot === 'done' ? 'var(--color-primary)' : dot === 'today' ? 'var(--color-primary)' : 'transparent',
              border: dot === 'today' ? '2px solid var(--color-primary)' : (dot === 'future' || dot === 'missed') ? '1.5px dashed var(--color-border)' : 'none',
              boxShadow: dot === 'today' ? '0 0 0 2px var(--color-primary-soft)' : 'none',
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '0 var(--space-page-x) 16px' }}>
      <div className="vq-streak-hero">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.8 }}>Streak doamu</div>
            <div className="vq-mono" style={{ fontSize: 56, fontWeight: 700, lineHeight: 0.95, marginTop: 6, letterSpacing: '-0.02em' }}>{streak}</div>
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
          {streakText || '"Tetap setia tiap pagi — Tuhan menjumpaimu di tempat yang sama."'}
        </div>
        <div style={{ position: 'relative', marginTop: 14, display: 'flex', gap: 6 }}>
          {weekDots.map((dot, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, letterSpacing: 0.4 }}>{dayLabels[i]?.toUpperCase()}</span>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: dot === 'done' ? '#fff' : dot === 'today' ? '#FAC775' : dot === 'missed' ? 'rgba(255,100,100,0.3)' : 'rgba(255,255,255,0.18)',
                color: dot === 'done' ? 'var(--color-primary)' : dot === 'today' ? '#412402' : 'rgba(255,255,255,0.7)',
              }}>
                {dot === 'done' ? <GCheck size={13} color="var(--color-primary)" stroke={2.5} /> : dot === 'today' ? '!' : '·'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Quest card ───────────────────────────────────────────────────────────────
function QuestCard({
  icon,
  title,
  desc,
  ctaLabel,
  done,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  ctaLabel: string;
  done: boolean;
  onAction: () => void;
}) {
  return (
    <div
      className="vq-quest-card vq-card"
      style={{
        margin: '0 var(--space-page-x) 10px',
        background: done ? 'var(--color-bg-muted)' : 'var(--color-bg-card)',
        opacity: done ? 0.85 : 1,
      }}
    >
      {/* Compact row */}
      <div className="vq-quest-row-compact" style={{ alignItems: 'center', gap: 12 }}>
        <div className="vq-quest-icon" style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'var(--color-primary)' : 'var(--color-primary-soft)',
          color: done ? '#fff' : 'var(--color-primary)',
        }}>
          {done ? <GCheck size={18} stroke={3} color={done ? '#fff' : 'var(--color-primary)'} /> : icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: done ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            textDecorationLine: done ? 'line-through' : 'none',
            textDecorationColor: done ? 'var(--color-text-muted)' : 'transparent',
            textDecorationThickness: '1.5px',
          }}>{title}</div>
          <div style={{
            fontSize: 12,
            color: done ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            marginTop: 1, fontWeight: done ? 600 : 400,
          }}>{done ? 'Selesai · +20 XP' : desc}</div>
        </div>
        <button
          className="vq-tap"
          onClick={onAction}
          aria-label={ctaLabel}
          style={{
            background: done ? 'transparent' : 'var(--color-primary)',
            border: done ? '1px solid var(--color-border)' : 'none',
            borderRadius: 10, padding: '8px 10px',
            color: done ? 'var(--color-text-muted)' : '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}
        >
          <GChevronR color={done ? 'var(--color-text-muted)' : '#fff'} />
        </button>
      </div>

      {/* Regular density layout */}
      <div className="vq-quest-row-regular" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="vq-quest-icon" style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--color-primary-soft)',
          color: 'var(--color-primary)',
        }}>
          {done ? <GCheck size={22} stroke={2.5} color="var(--color-primary)" /> : icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <span className={`vq-badge soft`} style={done ? { opacity: 0.7 } : undefined}>{done ? 'Selesai' : 'Belum'}</span>
      </div>
      {!done && (
        <button className="vq-cta vq-quest-cta vq-tap" onClick={onAction} style={{ marginTop: 12 }}>{ctaLabel}</button>
      )}
      {done && (
        <div className="vq-quest-cta" style={{
          marginTop: 12, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 12, background: 'var(--color-primary-soft)',
          color: 'var(--color-primary)', fontWeight: 700, fontSize: 14, gap: 6,
        }}>
          <GCheck size={16} stroke={2.5} color="var(--color-primary)" /> Sudah selesai
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function VerseQuestHome({
  state,
  displayStreak,
  submittedToday,
  weekDots,
  moodEmoji: _moodEmoji,
  submitVerse,
  firmanConfig,
  firmanPoll,
  gratitudeQuest,
  portalReady,
  devotionAvailable,
}: VerseQuestHomeProps) {
  const { locale } = useLocale();
  const { displayOrder } = useDisplayOrder();
  const { density, streakStyle } = useDisplayPrefs();
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

  const taskDone = submittedToday;
  const displayName = state.profile.name || (locale === "id" ? "Anda" : "there");

  const headerDate = useMemo(() => formatHeaderDate(locale, new Date()), [locale]);
  const greetingText = useMemo(() => greetingLine(locale, displayName, new Date().getHours()), [locale, displayName]);
  const streakText = useMemo(() => {
    const lossStreak = computeLossStreakFromLastSubmit(state.last_submitted_at, getTodayString());
    return getMoodMessage(displayStreak, lossStreak);
  }, [displayStreak, state.last_submitted_at]);

  const totalQuests = 3 + (firmanConfig ? 1 : 0);
  const doneQuests =
    (submittedToday ? 1 : 0) +
    (devotionRead ? 1 : 0) +
    (gratitudeQuest.doneForToday ? 1 : 0) +
    (firmanConfig && firmanPoll.doneForToday ? 1 : 0);
  const progress = totalQuests ? (doneQuests / totalQuests) * 100 : 0;

  const canSubmitFromReadingList =
    schedulePassageStatus === "ok" &&
    schedulePassage != null &&
    schedulePassage.length > 0;

  function handleSubmitFromSchedule(row: { chapter: number; verse: number; text: string }) {
    if (!todaySchedule || taskDone || verseSubmitLock.current) return;
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

  // ── Reading schedule card ──
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
                    <div key={`${rowKey}-${i}`} style={{ marginBottom: 8 }}>
                      {(i === 0 || schedulePassage[i - 1]!.chapter !== row.chapter) && (
                        <p style={{ marginBottom: 6, marginTop: i === 0 ? 0 : 8, fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          {m.scheduleChapterHeading(row.chapter)}
                        </p>
                      )}
                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setScheduleVerseSelectedKey((k) => (k === rowKey ? null : rowKey))}
                          className="vq-tap"
                          style={{
                            flex: 1, textAlign: 'left',
                            background: selected ? 'var(--color-primary-soft)' : 'transparent',
                            border: `1px solid ${selected ? 'var(--color-primary-border)' : 'transparent'}`,
                            borderRadius: 10, padding: '8px 10px',
                            fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-body)',
                            cursor: 'pointer', fontFamily: 'var(--font-body)',
                          }}
                        >
                          <span className="vq-mono" style={{ color: 'var(--color-primary)', fontWeight: 700, marginRight: 6, fontSize: 12 }}>
                            {row.chapter}:{row.verse}
                          </span>
                          {row.text}
                        </button>
                        {selected && !taskDone && (
                          <button
                            type="button"
                            onClick={() => handleSubmitFromSchedule(row)}
                            className="vq-tap"
                            style={{
                              flexShrink: 0, background: 'var(--color-primary)', color: '#fff',
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

  // ── Missions section ──
  const missionsSection = (
    <div>
      <div style={{ padding: '0 var(--space-page-x)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          {m.questToday}
        </div>
        <div className="vq-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{doneQuests}/{totalQuests}</div>
      </div>

      {/* Progress bar */}
      <div style={{ margin: '0 var(--space-page-x) 14px', height: 6, background: 'var(--color-bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))', transition: 'width 0.5s ease' }} />
      </div>

      <QuestCard
        icon={<GCross size={22} color="var(--color-primary)" />}
        title={m.taskTitle}
        desc={taskDone ? m.taskDescDone : m.taskDescPending}
        ctaLabel={m.taskTitle}
        done={taskDone}
        onAction={() => document.getElementById('reading-anchor')?.scrollIntoView({ block: 'start', behavior: 'smooth' })}
      />

      <QuestCard
        icon={<GBook size={22} color="var(--color-primary)" />}
        title={m.devotionTaskTitle}
        desc={devotionRead ? m.devotionTaskDoneDesc : devotionAvailable ? m.devotionTaskAvailableDesc : m.devotionTaskUnavailableDesc}
        ctaLabel={m.devotionTaskReadCta}
        done={devotionRead}
        onAction={() => router.push("/devotional")}
      />

      {firmanConfig && (
        <QuestCard
          icon={<GCheckCircle size={22} color="var(--color-primary)" />}
          title={m.task2Title}
          desc={firmanPoll.doneForToday ? m.task2DescDone : firmanPoll.doneYesterday ? m.task2DescYesterday : m.task2DescPending}
          ctaLabel={m.firmanPollCta}
          done={firmanPoll.doneForToday}
          onAction={() => { setFirmanModalKey((k) => k + 1); setFirmanOpen(true); }}
        />
      )}

      <QuestCard
        icon={<GHeart size={20} color="var(--color-primary)" />}
        title={m.taskGratitudeTitle}
        desc={gratitudeQuest.doneForToday ? m.taskGratitudeDescDone : m.taskGratitudeDescPending}
        ctaLabel={m.gratitudeCta}
        done={gratitudeQuest.doneForToday}
        onAction={() => { setGratitudeModalKey((k) => k + 1); setGratitudeOpen(true); }}
      />
    </div>
  );

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-page)', position: 'relative' }}
      data-density={density}
    >
      {/* Header */}
      <div className="vq-header">
        <div className="vq-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GCross size={18} color="#fff" />
            </div>
            <div>
              <div className="vq-title">
                Verse<span style={{ color: 'var(--color-primary)' }}>Quest</span>
              </div>
              <div className="vq-subtitle">{headerDate}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="vq-id-chip">
              <span className="dot" />
              {displayName} · {state.profile.ranting ?? ''}
            </div>
            {signOutConfirm ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Yakin keluar?</span>
                <button
                  className="vq-pill vq-tap"
                  onClick={() => router.push('/login')}
                  style={{ color: 'var(--color-danger)', minHeight: 28, padding: '3px 10px', fontSize: 12 }}
                >Ya</button>
                <button
                  className="vq-pill vq-tap"
                  onClick={() => setSignOutConfirm(false)}
                  style={{ color: 'var(--color-text-muted)', minHeight: 28, padding: '3px 10px', fontSize: 12 }}
                >Batal</button>
              </div>
            ) : (
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
            )}
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
            {taskDone ? m.subtitleDone : m.subtitlePending}
          </div>
        </div>

        <StreakHero
          streak={displayStreak}
          weekDots={weekDots}
          submitted={submittedToday}
          streakText={streakText}
          variant={streakStyle}
        />

        {displayOrder === 'reading_first' ? (
          <>{readingScheduleSection}{missionsSection}</>
        ) : (
          <>{missionsSection}{readingScheduleSection}</>
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

      {/* Success overlay */}
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
