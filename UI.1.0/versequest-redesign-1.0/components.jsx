/* global React, GBook, GCross, GHands, GHeart, GCheck, GFlame, GSparkle, GBack, GChevronR, GHome, GUsers, GPray, GCheckCircle, GPlus, GPhone, GWhatsApp, GMoon, GBoltSmall, GClock, GLogout, GShare, GArchive, GPencil, ME, SCHEDULE, PRAYERS_INITIAL, MEMBERS_ALL, COMMUNITY_VERSES, relTime, bookName */

const { useState: uS, useEffect: uE, useMemo: uM } = React;

// ─── Shared header ───────────────────────────────────────────────────────
// variant: "default" | "transparent" | "warm"
// transparent: no bg/border; adds is-scrolled class after 8px scroll
function Header({ title, subtitle, showBack, onBack, trailing, variant = 'default', scrollRef }) {
  const headerRef = uE && React.useRef(null);
  React.useEffect(() => {
    if (variant !== 'transparent') return;
    const scroller = scrollRef?.current || headerRef?.current?.nextElementSibling;
    if (!scroller) return;
    const header = headerRef.current;
    const onScroll = () => {
      if (!header) return;
      if (scroller.scrollTop > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [variant]);

  return (
    <div ref={headerRef} className="vq-header" data-variant={variant === 'default' ? undefined : variant}>
      <div className="vq-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {showBack && (
            <button className="vq-tap" onClick={onBack} aria-label="Kembali" style={{
              background: 'transparent', border: 'none', padding: 4, marginLeft: -4, cursor: 'pointer',
              color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center',
            }}>
              <GBack size={22}/>
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="vq-title">{title}</div>
            {subtitle && <div className="vq-subtitle">{subtitle}</div>}
          </div>
        </div>
        {trailing}
      </div>
    </div>
  );
}

// ─── User identity chip + sign-out ───────────────────────────────────────
function IdChip({ onSignOut }) {
  const [confirming, setConfirming] = uS(false);
  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Yakin keluar?</span>
        <button className="vq-pill vq-tap" onClick={onSignOut} style={{ color: 'var(--color-danger)', minHeight: 28, padding: '3px 10px' }}>Ya</button>
        <button className="vq-pill vq-tap" onClick={() => setConfirming(false)} style={{ color: 'var(--color-text-muted)', minHeight: 28, padding: '3px 10px' }}>Batal</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="vq-id-chip"><span className="dot"/> {ME.name} · {ME.ranting}</div>
      <button className="vq-tap" onClick={() => setConfirming(true)} aria-label="Keluar" style={{
        background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8,
        padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4,
        color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--font-body)',
      }}>
        <GLogout size={12}/> Keluar
      </button>
    </div>
  );
}

// ─── DailyRing ────────────────────────────────────────────────────────────
function DailyRing({ streak, doneQuests }) {
  // SVG ring geometry
  const R = 60, CX = 80, CY = 80, SW = 8;
  const gapDeg = (6 / R) * (180 / Math.PI); // 6px arc → degrees
  const segDeg = (360 - 4 * gapDeg) / 4;
  const halfGap = gapDeg / 2;
  const toRad = d => d * Math.PI / 180;
  const pt = a => ({ x: CX + R * Math.cos(toRad(a)), y: CY + R * Math.sin(toRad(a)) });
  function segPath(slot) {
    const s = -90 + slot * 90 + halfGap;
    const e = s + segDeg;
    const a = pt(s), b = pt(e);
    return `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${R},${R} 0 0,1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`;
  }

  const isComplete  = doneQuests === 4;
  const isProgress  = doneQuests > 0 && !isComplete;
  const segColor    = isComplete ? '#F59E0B' : 'var(--color-primary)';
  const trackColor  = 'var(--color-bg-muted)';
  const centerColor = isComplete ? '#F59E0B' : isProgress ? 'var(--color-primary)' : 'var(--color-text-muted)';

  // Confetti burst on first 4/4
  const [confetti, setConfetti] = uS(false);
  const prevDone = React.useRef(doneQuests);
  uE(() => {
    if (doneQuests === 4 && prevDone.current < 4) {
      setConfetti(true);
      const t = setTimeout(() => setConfetti(false), 1500);
      prevDone.current = 4;
      return () => clearTimeout(t);
    }
    if (doneQuests < 4) prevDone.current = doneQuests;
  }, [doneQuests]);

  // Week strip: Mon–Sun
  const dayOrder  = [1, 2, 3, 4, 5, 6, 0];
  const dayLabels = { 0: 'M', 1: 'S', 2: 'S', 3: 'R', 4: 'K', 5: 'J', 6: 'S' };
  const todayDay  = new Date().getDay();

  return (
    <div style={{ margin: '0 var(--space-page-x) 14px', position: 'relative' }}>
      <div className="vq-card" style={{ padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>

        {/* SVG ring */}
        <div style={{ position: 'relative', width: 160, height: 160 }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            {/* track */}
            {[0,1,2,3].map(i => (
              <path key={`t${i}`} d={segPath(i)} fill="none" stroke={trackColor} strokeWidth={SW} strokeLinecap="round"/>
            ))}
            {/* filled segments — remount on count change to re-trigger draw anim */}
            {[0,1,2,3].filter(i => i < doneQuests).map(i => (
              <path
                key={`f${i}-${doneQuests}`}
                d={segPath(i)} fill="none" stroke={segColor} strokeWidth={SW} strokeLinecap="round"
                strokeDasharray="90 999"
                style={{ animation: 'vq-ring-draw 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards', transition: 'stroke 0.4s ease' }}
              />
            ))}
          </svg>

          {/* center: streak number + flame */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <span className="vq-mono" style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: centerColor }}>
              {streak}
            </span>
            <span className={isProgress ? 'vq-daily-ring-flame-pulse' : undefined}>
              <GFlame size={16} color={centerColor}/>
            </span>
          </div>
        </div>

        {/* 7-day strip */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', marginTop: 12 }}>
          {dayOrder.map((d, idx) => {
            const isToday = d === todayDay;
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)', letterSpacing: 0.2 }}>
                  {dayLabels[d]}
                </span>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isToday ? 'var(--color-primary)' : 'var(--color-bg-muted)',
                  border: isToday ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  boxShadow: isToday ? '0 0 0 2px var(--color-primary-soft)' : 'none',
                }}/>
              </div>
            );
          })}
        </div>

        {/* confetti burst */}
        {confetti && <ConfettiParticles/>}
      </div>
    </div>
  );
}

function ConfettiParticles() {
  const hues = [258, 45, 320, 195, 18];
  const particles = React.useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.45,
    hue: hues[i % hues.length],
    w: 4 + Math.random() * 5,
    h: 4 + Math.random() * 7,
    dx: (Math.random() - 0.5) * 90,
    rot: Math.random() * 720 - 360,
  })), []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          top: '42%',
          left: `${p.left}%`,
          width: p.w,
          height: p.h,
          borderRadius: 1,
          background: `hsl(${p.hue}, 72%, 62%)`,
          animationName: 'vq-confetti',
          animationDuration: '1.2s',
          animationDelay: `${p.delay}s`,
          animationFillMode: 'forwards',
          animationTimingFunction: 'ease-out',
          '--vq-dx': `${p.dx}px`,
          '--vq-rot': `${p.rot}deg`,
        }}/>
      ))}
    </div>
  );
}

// ─── CelebrationBanner ────────────────────────────────────────────────────
function CelebrationBanner({ visible }) {
  if (!visible) return null;
  return (
    <div style={{
      margin: '0 var(--space-page-x) 12px',
      background: '#FEF3C7',
      border: '1px solid #F59E0B',
      borderRadius: 14,
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'vq-celebration-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>
      <GSparkle size={18} color="#D97706"/>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#92400E', lineHeight: 1.45 }}>
        Harimu lengkap. Tuhan menyertaimu!
      </span>
    </div>
  );
}

// ─── ConfirmSheet — reusable 2-option bottom sheet ────────────────────────
function ConfirmSheet({ question = 'Apakah kamu sudah melakukan Firman hari ini?', confirmLabel = 'Ya, sudah', cancelLabel = 'Belum', onConfirm, onCancel }) {
  return (
    <>
      <div className="vq-modal-backdrop" onClick={onCancel}/>
      <div className="vq-sheet" onClick={e => e.stopPropagation()}>
        <div className="vq-sheet-handle"/>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
          Checklist Firman
        </div>
        <div style={{ fontSize: 15, color: 'var(--color-text-body)', lineHeight: 1.55, marginBottom: 22 }}>
          {question}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} className="vq-tap" style={{
            flex: 1, height: 48, borderRadius: 12, border: '1.5px solid var(--color-border)',
            background: 'transparent', fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} className="vq-tap" style={{
            flex: 2, height: 48, borderRadius: 12, border: 'none',
            background: 'var(--color-primary)', fontSize: 15, fontWeight: 700, color: '#fff',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </>
  );
}

// ─── QuestRow — single tappable row inside QuestGroup ────────────────────
function QuestRow({ primary, icon, title, desc, done, onTap, isLast }) {
  return (
    <button
      className="vq-quest-group-row vq-tap"
      onClick={onTap}
      disabled={done && !primary}
      style={{
        minHeight: primary ? 58 : 48,
        padding: primary ? '10px 16px' : '8px 16px',
        gap: 12,
        opacity: done ? 0.6 : 1,
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--color-primary)' : 'var(--color-primary-soft)',
        color: done ? '#fff' : 'var(--color-primary)',
      }}>
        {done ? <GCheck size={16} stroke={3} color="#fff"/> : icon}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{
          fontSize: primary ? 15 : 14,
          fontWeight: primary ? 700 : 600,
          color: done ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
          textDecoration: done ? 'line-through' : 'none',
          textDecorationColor: 'var(--color-text-muted)',
          lineHeight: 1.3,
        }}>{title}</div>
        {primary && desc && (
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2, fontWeight: 400 }}>{desc}</div>
        )}
      </div>
      {done
        ? <span className="vq-badge success" style={{ flexShrink: 0 }}><GCheck size={10} stroke={2.5}/> Selesai</span>
        : <GChevronR size={16} color="var(--color-text-muted)"/>
      }
    </button>
  );
}

// ─── QuestGroup — unified grouped card for all 4 quests ───────────────────
function QuestGroup({ taskState, setTaskState, onNavigate, doneQuests }) {
  const [confirmOpen, setConfirmOpen] = uS(false);

  // All-done: collapse to compact summary row
  if (doneQuests === 4) {
    return (
      <div style={{ margin: '0 var(--space-page-x) 12px' }}>
        <div className="vq-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          <GCheckCircle size={20} color="var(--color-success-text)" filled/>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            4 / 4 misi selesai ✓
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ margin: '0 var(--space-page-x) 12px' }}>
        <div className="vq-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              Misi Hari Ini
            </span>
            <span className="vq-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {doneQuests}/4
            </span>
          </div>

          {/* ✦ PRIMARY: Submit Firman */}
          <QuestRow
            primary
            icon={<GCross size={20}/>}
            title="Submit Firman"
            desc={taskState.verse ? 'Ayat tersimpan untuk hari ini.' : 'Pilih satu ayat dari bacaan di bawah.'}
            done={taskState.verse}
            onTap={() => document.getElementById('reading-anchor')?.scrollIntoView({ block: 'start', behavior: 'smooth' })}
          />

          <QuestRow
            icon={<GBook size={18}/>}
            title="Renungan Pagi"
            done={taskState.devotion}
            onTap={() => onNavigate('devotional')}
          />

          <QuestRow
            icon={<GCheckCircle size={18}/>}
            title="Checklist Firman"
            done={taskState.firman}
            onTap={() => !taskState.firman && setConfirmOpen(true)}
          />

          <QuestRow
            isLast
            icon={<GHeart size={18}/>}
            title="3 Hal Bersyukur"
            done={taskState.gratitude}
            onTap={() => !taskState.gratitude && setTaskState(s => ({ ...s, gratitude: true }))}
          />
        </div>
      </div>

      {confirmOpen && (
        <ConfirmSheet
          onConfirm={() => { setTaskState(s => ({ ...s, firman: true })); setConfirmOpen(false); }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}

// ─── Streak hero (variants: 'arc' | 'dots' | 'minimal') ──────────────────
function StreakHero({ streak, variant = 'arc', moodEmoji, submitted = false }) {
  const weekDots = [
    { l: 'Sen', s: 'done' }, { l: 'Sel', s: 'done' }, { l: 'Rab', s: 'done' },
    { l: 'Kam', s: 'done' }, { l: 'Jum', s: 'today' }, { l: 'Sab', s: 'pending' }, { l: 'Min', s: 'pending' },
  ];

  if (variant === 'minimal') {
    if (submitted) {
      // Compact single-row "done" state — just streak + week dots
      return (
        <div style={{
          margin: `0 ${'var(--space-page-x)'} 16px`,
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
              <GFlame size={16} color="var(--color-primary)"/>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="vq-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{streak}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>hari · streak aktif</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {weekDots.map((d, i) => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: d.s === 'done' ? 'var(--color-primary)' : d.s === 'today' ? 'var(--color-primary)' : 'transparent',
                border: d.s === 'today' ? '2px solid var(--color-primary)' : d.s === 'pending' ? '1.5px dashed var(--color-border)' : 'none',
                boxShadow: d.s === 'today' ? '0 0 0 2px var(--color-primary-soft)' : 'none',
              }}/>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div style={{
        margin: `0 ${'var(--space-page-x)'} 16px`,
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 18, padding: '18px 18px 14px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Streak</div>
          <div className="vq-mono" style={{ fontSize: 44, fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1, marginTop: 2 }}>{streak}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, fontStyle: 'italic' }}>hari berturut-turut</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {weekDots.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>{d.l[0]}</span>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: d.s === 'done' ? 'var(--color-primary)' : d.s === 'today' ? 'var(--color-primary-soft)' : 'transparent',
                border: d.s === 'today' ? '2px solid var(--color-primary)' : d.s === 'pending' ? '1.5px dashed var(--color-border)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {d.s === 'done' && <GCheck size={12} color="#fff" stroke={2.5}/>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 'arc' (default — soft hand-drawn arc background)
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
            <GFlame size={28} color="#FFD27A"/>
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
          {weekDots.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, letterSpacing: 0.4 }}>{d.l.toUpperCase()}</span>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                background: d.s === 'done' ? '#fff' : d.s === 'today' ? '#FAC775' : 'rgba(255,255,255,0.18)',
                color: d.s === 'done' ? 'var(--color-primary)' : d.s === 'today' ? '#412402' : 'rgba(255,255,255,0.7)',
              }}>
                {d.s === 'done' ? <GCheck size={13} color="var(--color-primary)" stroke={2.5}/> : d.s === 'today' ? '!' : '·'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Quest card ───────────────────────────────────────────────────────────
function QuestCard({ icon, title, desc, ctaLabel, done, onAction, accent = 'pending' }) {
  return (
    <div className="vq-quest-card vq-card" style={{
      margin: '0 var(--space-page-x) 10px',
      background: done ? 'var(--color-bg-muted)' : 'var(--color-bg-card)',
      borderColor: done ? 'var(--color-border)' : 'var(--color-border)',
      opacity: done ? 0.85 : 1,
    }}>
      {/* Compact row (visible only in compact density) */}
      <div className="vq-quest-row-compact" style={{ alignItems: 'center', gap: 12 }}>
        <div className="vq-quest-icon" style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'var(--color-primary)' : 'var(--color-primary-soft)',
          color: done ? '#fff' : 'var(--color-primary)',
        }}>
          {done ? <GCheck size={18} stroke={3}/> : icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: done ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            textDecoration: done ? 'line-through' : 'none',
            textDecorationColor: done ? 'var(--color-text-muted)' : 'transparent',
            textDecorationThickness: '1.5px',
          }}>{title}</div>
          <div style={{
            fontSize: 12,
            color: done ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            marginTop: 1,
            fontWeight: done ? 600 : 400,
          }}>{done ? 'Selesai · +20 XP' : desc}</div>
        </div>
        {!done && (
          <button className="vq-tap" onClick={onAction} aria-label={ctaLabel} style={{
            background: 'var(--color-primary)', border: 'none', borderRadius: 10, padding: '8px 10px',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}><GChevronR color="#fff"/></button>
        )}
        {done && (
          <button className="vq-tap" onClick={onAction} aria-label={`Buka kembali ${title}`} style={{
            background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 10,
            padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            color: 'var(--color-text-muted)',
          }}><GChevronR color="var(--color-text-muted)"/></button>
        )}
      </div>

      {/* Regular density layout */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} className="vq-quest-row-regular">
        <div className="vq-quest-icon" style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'var(--color-primary-soft)' : 'var(--color-primary-soft)',
          color: done ? 'var(--color-primary)' : 'var(--color-primary)',
        }}>
          {done ? <GCheck size={22} stroke={2.5}/> : icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <span className={done ? 'vq-badge soft' : 'vq-badge soft'} style={done ? { opacity: 0.7 } : undefined}>{done ? 'Selesai' : 'Belum'}</span>
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
          <GCheck size={16} stroke={2.5}/> Sudah selesai
        </div>
      )}
    </div>
  );
}

// ─── Submit-firman banner ────────────────────────────────────────────────
function SubmitBanner({ onTap }) {
  return (
    <button className="vq-tap" onClick={onTap} style={{
      width: 'calc(100% - 40px)',
      margin: '0 var(--space-page-x) 14px',
      background: 'linear-gradient(135deg, #534AB7 0%, #6657C9 100%)',
      color: '#fff', border: 'none', borderRadius: 16,
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      textAlign: 'left', cursor: 'pointer',
      boxShadow: '0 6px 18px rgba(83,74,183,0.28)',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <GCross size={22} color="#fff"/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Submit firman hari ini</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 1 }}>Pilih satu ayat dari Mazmur 23 di bawah</div>
      </div>
      <GChevronR color="#fff"/>
    </button>
  );
}

// ─── Reading schedule card (revamped) ─────────────────────────────────────
function ReadingCard({ onSubmitVerse, submittedToday }) {
  const [selected, setSelected] = uS(null);
  const [expanded, setExpanded] = uS(false);
  const SHOW_LIMIT = 8;
  const EXPAND_THRESHOLD = 12;
  const passage = SCHEDULE.passage;
  const hasMore = passage.length > EXPAND_THRESHOLD;
  const displayed = hasMore && !expanded ? passage.slice(0, SHOW_LIMIT) : passage;

  function handleSelect(v) {
    if (submittedToday) return; // no re-selection after submit
    setSelected(sel => sel === v ? null : v);
  }

  function handleSubmit(row) {
    setSelected(row.v); // keep highlighted
    onSubmitVerse(row);
  }

  return (
    <div style={{ margin: '0 var(--space-page-x) 14px' }}>
      <div className="vq-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Bacaan Hari Ini</div>
          <span className="vq-badge soft" style={{ display: 'inline-flex', gap: 4 }}>
            <GBoltSmall size={11}/> +20 XP
          </span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
          {SCHEDULE.book} 23
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>{SCHEDULE.reading}</div>

        {/* flat list — no maxHeight, no internal scroll */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          {displayed.map((row) => {
            const isSel = selected === row.v;
            return (
              <div key={row.v} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => handleSelect(row.v)}
                  className="vq-tap"
                  style={{
                    width: '100%', textAlign: 'left',
                    background: isSel ? 'var(--color-primary-soft)' : 'transparent',
                    border: '1px solid transparent',
                    borderColor: isSel ? 'var(--color-primary-border)' : 'transparent',
                    borderLeft: isSel ? '3px solid var(--color-primary)' : '3px solid transparent',
                    borderRadius: 10, padding: '8px 10px',
                    fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-body)',
                    cursor: submittedToday ? 'default' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <span className="vq-mono" style={{ color: 'var(--color-primary)', fontWeight: 700, marginRight: 6, fontSize: 12 }}>
                    {row.c}:{row.v}
                  </span>
                  {row.t}
                </button>
                {/* anchored below the verse row — not below the whole list */}
                {isSel && submittedToday && (
                  <div style={{ marginTop: 4, marginLeft: 10 }}>
                    <span className="vq-badge success">
                      <GCheck size={10} stroke={2.5}/> Sudah dipilih ✓
                    </span>
                  </div>
                )}
                {isSel && !submittedToday && (
                  <button onClick={() => handleSubmit(row)} className="vq-tap" style={{
                    marginTop: 6, marginLeft: 10,
                    background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: 10, padding: '8px 14px',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--font-body)',
                  }}>
                    <GCheck size={14} color="#fff" stroke={2.5}/> Pilih ayat ini
                  </button>
                )}
              </div>
            );
          })}

          {hasMore && !expanded && (
            <button onClick={() => setExpanded(true)} className="vq-tap" style={{
              width: '100%', textAlign: 'center', padding: '10px 0',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'var(--color-primary)',
              fontFamily: 'var(--font-body)',
            }}>
              Tampilkan semua ({passage.length} ayat)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRD-004: HighlightToolbar ────────────────────────────────────────────
function HighlightToolbar({ hasHighlight, onColor, onNote, onRemove, onDismiss }) {
  const COLORS = [
    { hex: '#FDE68A', label: 'Kuning' },
    { hex: '#BBF7D0', label: 'Hijau' },
    { hex: '#C4B5FD', label: 'Lavender' },
  ];
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0,
      marginTop: 6, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="vq-hl-toolbar" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 24, padding: '7px 12px',
      }}>
        {COLORS.map(({ hex, label }) => (
          <button key={hex} className="vq-tap" onClick={() => onColor(hex)} title={label}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: hex, border: '1.5px solid rgba(0,0,0,0.1)',
              cursor: 'pointer', flexShrink: 0, padding: 0,
            }}/>
        ))}
        <div style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 2px' }}/>
        <button className="vq-tap" onClick={onNote}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', padding: '2px 6px', fontFamily: 'var(--font-body)' }}>
          Catat
        </button>
        {hasHighlight && <>
          <div style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 2px' }}/>
          <button className="vq-tap" onClick={onRemove}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--color-danger)', padding: '2px 6px', fontFamily: 'var(--font-body)' }}>
            Hapus
          </button>
        </>}
        <button className="vq-tap" onClick={onDismiss}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px 4px', lineHeight: 1, fontSize: 15 }}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── PRD-004: NoteSheet ───────────────────────────────────────────────────
function NoteSheet({ snippet, initialNote, onSave, onClose }) {
  const [text, setText] = uS(initialNote || '');
  const MAX = 1000;
  const showCount = text.length > 800;

  return (
    <>
      <div className="vq-modal-backdrop" onClick={onClose}/>
      <div className="vq-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="vq-sheet-handle"/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>Catatanmu</div>
          <button onClick={onClose} className="vq-tap" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 22, padding: 4 }}>×</button>
        </div>

        {snippet && (
          <div style={{
            padding: '8px 12px', background: 'var(--color-bg-muted)',
            borderRadius: 10, marginBottom: 12,
            fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.55,
            fontStyle: 'italic', borderLeft: '3px solid var(--color-primary)',
          }}>
            {snippet}
          </div>
        )}

        <textarea
          className="vq-textarea"
          placeholder="Tulis refleksimu..."
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          autoFocus
          style={{ minHeight: 120 }}
        />

        {showCount && (
          <div style={{ textAlign: 'right', fontSize: 11, marginTop: 4, color: text.length > 950 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
            {text.length} / {MAX}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="vq-tap" onClick={onClose} style={{
            flex: 1, height: 44, borderRadius: 12,
            border: '1.5px solid var(--color-border)', background: 'transparent',
            fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>Batalkan</button>
          <button className="vq-cta vq-tap" onClick={() => onSave(text)} disabled={!text.trim()} style={{ flex: 2, minHeight: 44 }}>
            Simpan
          </button>
        </div>
      </div>
    </>
  );
}

// ─── PRD-004: ReaderSettingsPanel ─────────────────────────────────────────
function ReaderSettingsPanel({ prefs, onChange }) {
  const sizes = [
    { key: 'small',  label: 'A', fs: 13 },
    { key: 'medium', label: 'A', fs: 16 },
    { key: 'large',  label: 'A', fs: 20 },
  ];
  const themes = [
    { key: 'light', label: 'Terang' },
    { key: 'dark',  label: 'Gelap' },
    { key: 'sepia', label: 'Sepia' },
  ];
  const btnBase = (active) => ({
    height: 36, borderRadius: 10, border: '1.5px solid',
    borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
    background: active ? 'var(--color-primary-soft)' : 'var(--color-bg-muted)',
    color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <div className="vq-reader-settings" style={{
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
      background: 'var(--color-bg-card)',
      borderBottom: '1px solid var(--color-border)',
      padding: '14px var(--space-page-x) 16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    }}>
      {/* Font size */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', flex: 1 }}>Ukuran Teks</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {sizes.map(({ key, label, fs }) => (
            <button key={key} className="vq-tap" onClick={() => onChange('fontSize', key)}
              style={{ ...btnBase(prefs.fontSize === key), width: 40, fontSize: fs, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', flex: 1 }}>Tampilan</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {themes.map(({ key, label }) => (
            <button key={key} className="vq-tap" onClick={() => onChange('theme', key)}
              style={{ ...btnBase(prefs.theme === key), padding: '0 10px', fontSize: 12 }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PRD-004: LibraryCard ─────────────────────────────────────────────────
function LibraryCard({ date, reference, titleSnippet, hlCount, noteCount, onTap }) {
  return (
    <button className="vq-card vq-tap" onClick={onTap} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      display: 'block', border: 'none', fontFamily: 'var(--font-body)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>{date}</span>
        <span className="vq-badge soft">{reference}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4, marginBottom: 8 }}>
        {titleSnippet}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {hlCount > 0 && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#FDE68A', display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}/>
            {hlCount} highlight
          </span>
        )}
        {noteCount > 0 && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <GPencil size={10} color="var(--color-text-muted)"/>
            {noteCount} catatan
          </span>
        )}
        {hlCount === 0 && noteCount === 0 && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Sudah dibaca</span>
        )}
      </div>
    </button>
  );
}

Object.assign(window, {
  Header, IdChip,
  DailyRing, ConfettiParticles, CelebrationBanner,
  ConfirmSheet, QuestRow, QuestGroup,
  ReadingCard,
  // PRD-004
  HighlightToolbar, NoteSheet, ReaderSettingsPanel, LibraryCard,
  // kept for any external references
  StreakHero, QuestCard, SubmitBanner,
});
