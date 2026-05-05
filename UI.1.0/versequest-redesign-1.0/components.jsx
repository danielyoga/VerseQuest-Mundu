/* global React, GBook, GCross, GHands, GHeart, GCheck, GFlame, GSparkle, GBack, GChevronR, GHome, GUsers, GPray, GCheckCircle, GPlus, GPhone, GWhatsApp, GMoon, GBoltSmall, GClock, GLogout, ME, SCHEDULE, PRAYERS_INITIAL, MEMBERS_ALL, COMMUNITY_VERSES, relTime, bookName */

const { useState: uS, useEffect: uE, useMemo: uM } = React;

// ─── Shared header ───────────────────────────────────────────────────────
function Header({ title, subtitle, showBack, onBack, trailing }) {
  return (
    <div className="vq-header">
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
          “Tetap setia tiap pagi — Tuhan menjumpaimu di tempat yang sama.”
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

// ─── Reading schedule card ────────────────────────────────────────────────
function ReadingCard({ onSubmitVerse, submittedToday }) {
  const [selected, setSelected] = uS(null);

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

        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {SCHEDULE.passage.map((row) => {
            const isSel = selected === row.v;
            return (
              <div key={row.v} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setSelected(isSel ? null : row.v)}
                  className="vq-tap"
                  style={{
                    width: '100%', textAlign: 'left',
                    background: isSel ? 'var(--color-primary-soft)' : 'transparent',
                    border: '1px solid transparent', borderColor: isSel ? 'var(--color-primary-border)' : 'transparent',
                    borderRadius: 10, padding: '8px 10px',
                    fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-body)',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  <span className="vq-mono" style={{ color: 'var(--color-primary)', fontWeight: 700, marginRight: 6, fontSize: 12 }}>
                    {row.c}:{row.v}
                  </span>
                  {row.t}
                </button>
                {isSel && !submittedToday && (
                  <button onClick={() => onSubmitVerse(row)} className="vq-tap" style={{
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
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Header, IdChip, StreakHero, QuestCard, SubmitBanner, ReadingCard });
