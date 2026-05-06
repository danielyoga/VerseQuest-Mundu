/* global React, GBook, GCross, GHands, GHeart, GCheck, GFlame, GSparkle, GBack, GChevronR, GHome, GUsers, GPray, GCheckCircle, GPlus, GPhone, GWhatsApp, GMoon, GBoltSmall, GClock, GLogout, GShare, GArchive, GPencil, GNote, GPin, GEcho, GBell, GFilter, GHighlight, ME, SCHEDULE, PRAYERS_INITIAL, PRAYERS_ANSWERED, MEMBERS_ALL, COMMUNITY_VERSES, relTime, bookName, Header, IdChip, DailyRing, CelebrationBanner, QuestGroup, ReadingCard, HighlightToolbar, NoteSheet, ReaderSettingsPanel, LibraryCard */

const { useState: us, useEffect: ue, useMemo: um } = React;

// ─── HOME SCREEN ─────────────────────────────────────────────────────────
function HomeScreen({ onNavigate, taskState, setTaskState, onSubmitVerse }) {
  const doneQuests = (taskState.verse ? 1 : 0) + (taskState.devotion ? 1 : 0) + (taskState.firman ? 1 : 0) + (taskState.gratitude ? 1 : 0);

  // Dynamic greeting by time of day
  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 12 ? 'Selamat pagi' : hours < 18 ? 'Selamat siang' : 'Selamat malam';

  // Dynamic date string in Indonesian locale
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Context line driven by quest state
  const baseStreak = 12;
  const streak = doneQuests > 0 ? baseStreak + 1 : baseStreak;
  let contextLine;
  if (doneQuests === 4)        contextLine = `Hari ini selesai. Luar biasa, ${ME.name}.`;
  else if (doneQuests >= 1)    contextLine = `Sudah ${doneQuests} dari 4 misi. Hampir selesai!`;
  else if (baseStreak > 0)     contextLine = `Streak ${baseStreak} hari. Jangan putus hari ini.`;
  else                         contextLine = 'Hari baru. Mulai dari satu ayat.';

  // Celebration banner — auto-dismiss after 4 s when first reaching 4/4
  const [bannerVisible, setBannerVisible] = us(false);
  const prevDone = React.useRef(doneQuests);
  ue(() => {
    if (doneQuests === 4 && prevDone.current < 4) {
      setBannerVisible(true);
      const t = setTimeout(() => setBannerVisible(false), 4000);
      prevDone.current = 4;
      return () => clearTimeout(t);
    }
    if (doneQuests < 4) prevDone.current = doneQuests;
  }, [doneQuests]);

  return (
    <>
      <Header
        title={<>Verse<span style={{ color: 'var(--color-primary)' }}>Quest</span></>}
        subtitle={dateStr}
        trailing={<IdChip onSignOut={() => onNavigate('signin')} />}
      />

      <div className="vq-scroll" style={{ paddingBottom: 90, paddingTop: 16, position: 'relative' }}>
        <div className="vq-grain" />

        {/* Greeting */}
        <div style={{ padding: '0 var(--space-page-x) 14px', position: 'relative' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', letterSpacing: -0.01, lineHeight: 1.25 }}>
            {greeting}, {ME.name}.
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {contextLine}
          </div>
        </div>

        {/* DailyRing — replaces StreakHero */}
        <DailyRing streak={streak} doneQuests={doneQuests} />

        {/* All-done celebration banner */}
        <CelebrationBanner visible={bannerVisible} />

        {/* Grouped quest card */}
        <QuestGroup
          taskState={taskState}
          setTaskState={setTaskState}
          onNavigate={onNavigate}
          doneQuests={doneQuests}
        />

        {/* Reading card — always below quests (fixed order per PRD) */}
        <div id="reading-anchor">
          <ReadingCard onSubmitVerse={onSubmitVerse} submittedToday={taskState.verse} />
        </div>
      </div>
    </>
  );
}

// ─── KOMUNITAS — Sub-tab bar ─────────────────────────────────────────────
function SubTabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 var(--space-page-x)', height: 48, gap: 8 }}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="vq-tap"
            style={{
              flex: 1, height: 34,
              borderRadius: 'var(--radius-pill)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
              background: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--color-text-muted)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >{tab.label}</button>
        );
      })}
    </div>
  );
}

// ─── KOMUNITAS — Category filter strip ──────────────────────────────────
const DOA_CATEGORIES = ['Semua', 'Pribadi', 'Keluarga', 'Kesehatan', 'Pelayanan', 'Syukur'];

function CategoryFilter({ active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto',
      padding: '0 var(--space-page-x) 10px',
      scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
    }}>
      {DOA_CATEGORIES.map(cat => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className="vq-tap"
            style={{
              flexShrink: 0, height: 28, padding: '0 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer',
              border: isActive ? 'none' : '1px solid var(--color-border)',
              background: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--color-text-secondary)',
              transition: 'background 0.12s, color 0.12s',
            }}
          >{cat}</button>
        );
      })}
    </div>
  );
}

// ─── KOMUNITAS — Prayer card ─────────────────────────────────────────────
function PrayerCard({ prayer, isAmined, onToggleAmin, onSetConfirm }) {
  const [expanded, setExpanded] = us(false);
  const TEXT_LIMIT = 140;
  const isLong = prayer.text.length > TEXT_LIMIT;
  const displayText = isLong && !expanded ? prayer.text.slice(0, TEXT_LIMIT) + '…' : prayer.text;

  return (
    <div
      className={`vq-card ${prayer.own ? 'own' : ''}`}
      style={{
        position: 'relative',
        ...(prayer.pinned ? { borderLeft: '3px solid #F59E0B', borderRadius: 'var(--radius-lg)', paddingLeft: 13 } : {}),
      }}
    >
      {prayer.pinned && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B"><path d="M16 2l-1 9 3 3-8 8-3-3 9-8-9-1 9-8z"/></svg>
          <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700, letterSpacing: 0.3 }}>Disematkan koordinator</span>
          <span className="vq-badge soft" style={{ fontSize: 10, padding: '2px 8px' }}>{prayer.category}</span>
        </div>
      )}

      {!prayer.pinned && (
        <span className="vq-badge soft" style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, padding: '2px 8px' }}>
          {prayer.category}
        </span>
      )}

      {prayer.own && (
        <span className="vq-badge primary" style={{ position: 'absolute', top: 12, right: prayer.pinned ? 12 : 62 }}>
          Doamu
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingRight: prayer.own ? 68 : 60 }}>
        <div className="vq-avatar">{prayer.name.slice(0, 2).toUpperCase()}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>{prayer.name}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{prayer.ranting} · {relTime(prayer.minsAgo)}</div>
        </div>
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-body)' }}>
        {displayText}
        {isLong && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: '0 0 0 4px', fontSize: 13, fontFamily: 'var(--font-body)' }}
          >Baca selengkapnya</button>
        )}
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          className={`vq-pill vq-tap ${isAmined ? 'active' : ''}`}
          onClick={() => onToggleAmin(prayer.id)}
          style={{ color: 'var(--color-primary)' }}
        >
          <GPray size={14} filled={isAmined} />
          <span className="lbl">Amin · {prayer.likes}</span>
        </button>

        {prayer.own && (
          <button
            className="vq-pill vq-tap"
            onClick={() => onSetConfirm(prayer.id)}
            style={{ background: 'var(--color-success-bg)', borderColor: 'var(--color-success-border)', color: 'var(--color-success-text)' }}
          >
            <GCheckCircle size={14} /> <span className="lbl">Doa Terjawab</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── KOMUNITAS — Testimony sheet ─────────────────────────────────────────
function TestimonySheet({ onClose, onSubmit }) {
  const [testimony, setTestimony] = us('');
  const max = 300;
  return (
    <>
      <div className="vq-modal-backdrop" onClick={onClose} />
      <div className="vq-sheet" onClick={e => e.stopPropagation()}>
        <div className="vq-sheet-handle" />
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
          Puji Tuhan!
        </div>
        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.55, marginBottom: 14 }}>
          Ceritakan bagaimana doa ini dijawab{' '}
          <span style={{ color: 'var(--color-text-muted)' }}>(opsional)</span>
        </div>
        <textarea
          className="vq-textarea"
          placeholder="Tuliskan kesaksianmu..."
          value={testimony}
          onChange={e => setTestimony(e.target.value.slice(0, max))}
          style={{ minHeight: 90 }}
        />
        <div style={{ textAlign: 'right', fontSize: 12, marginTop: 4, marginBottom: 16, color: testimony.length >= max * 0.9 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
          {testimony.length} / {max}
        </div>
        <button className="vq-cta vq-tap" onClick={() => onSubmit(testimony)}>
          Tandai Terjawab
        </button>
      </div>
    </>
  );
}

// ─── KOMUNITAS — Doa Wall sub-tab ────────────────────────────────────────
function DoaWallTab({ prayers, amined, onToggleAmin, onSetConfirm }) {
  const [activeCategory, setActiveCategory] = us('Semua');
  const [answeredOpen, setAnsweredOpen] = us(false);

  const active = prayers.filter(p => !p.answered);
  const answered = prayers.filter(p => p.answered);
  const filtered = activeCategory === 'Semua' ? active : active.filter(p => p.category === activeCategory);
  const pinned = filtered.filter(p => p.pinned);
  const unpinned = filtered.filter(p => !p.pinned);

  return (
    <div style={{ paddingTop: 12, paddingBottom: 20 }}>
      <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      <div style={{ padding: '0 var(--space-page-x)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pinned.map(p => (
          <PrayerCard key={p.id} prayer={p} isAmined={amined.has(p.id)} onToggleAmin={onToggleAmin} onSetConfirm={onSetConfirm} />
        ))}
        {unpinned.map(p => (
          <PrayerCard key={p.id} prayer={p} isAmined={amined.has(p.id)} onToggleAmin={onToggleAmin} onSetConfirm={onSetConfirm} />
        ))}

        {answered.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <button
              onClick={() => setAnsweredOpen(o => !o)}
              className="vq-tap"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 'none', padding: '10px 4px', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span>
                <span style={{ marginRight: 6, fontStyle: 'normal' }}>{answeredOpen ? '▾' : '▸'}</span>
                Doa Terjawab ({answered.length})
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>
                {answeredOpen ? 'Tutup' : 'Lihat'}
              </span>
            </button>

            {answeredOpen && answered.map(p => (
              <div key={p.id} className="vq-card" style={{ marginBottom: 8, opacity: 0.7, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 10, left: 12, fontSize: 13, color: 'var(--color-primary)', opacity: 0.6 }}>✦</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingLeft: 24 }}>
                  <div className="vq-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{p.ranting} · {relTime(p.minsAgo)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-body)', paddingLeft: 24 }}>{p.text}</div>
                {p.testimony ? (
                  <div style={{ marginTop: 8, paddingLeft: 24, fontSize: 12, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--color-success-text)' }}>
                    "{p.testimony}"
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KOMUNITAS — Ayat Bersama sub-tab ────────────────────────────────────
function AyatBersamaTab({ verses, onToggleGema }) {
  return (
    <div style={{ padding: '12px var(--space-page-x) 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {verses.map(v => (
        <div
          key={v.id}
          className="vq-card"
          style={{
            position: 'relative',
            ...(v.pinned ? { borderLeft: '3px solid #F59E0B', borderRadius: 'var(--radius-lg)', paddingLeft: 13 } : {}),
          }}
        >
          {v.pinned && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B"><path d="M16 2l-1 9 3 3-8 8-3-3 9-8-9-1 9-8z"/></svg>
              <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700 }}>Disematkan koordinator</span>
            </div>
          )}

          <div aria-hidden style={{
            position: 'absolute', top: 10, right: 14,
            fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1,
            color: 'var(--color-primary)', opacity: 0.1, fontWeight: 700, pointerEvents: 'none',
          }}>&ldquo;</div>

          <div className="vq-quote" style={{ marginBottom: 10 }}>{v.text}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="vq-badge soft" style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <GBook size={10} />{v.book} {v.c}:{v.v}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{v.date}</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              oleh <strong>{v.sharedBy}</strong> · {v.ranting}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="vq-pill vq-tap"
              onClick={() => onToggleGema(v.id)}
              style={{
                color: 'var(--color-primary)',
                background: v.gemad ? 'var(--color-primary-soft)' : 'transparent',
                borderColor: v.gemad ? 'var(--color-primary-border)' : 'var(--color-primary)',
              }}
            >
              <GFlame size={14} color="var(--color-primary)" />
              <span className="lbl">{v.gemad ? 'Di-gema ✓' : 'Gema'} · {v.gema + (v.gemad ? 1 : 0)}</span>
            </button>

            <button
              className="vq-pill vq-tap"
              onClick={() => {
                const shareText = `"${v.text}" — ${v.book} ${v.c}:${v.v}\n\nDikirim dari VerseQuest`;
                if (navigator.share) {
                  navigator.share({ text: shareText }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(shareText);
                }
              }}
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
              </svg>
              <span className="lbl">Bagikan</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── KOMUNITAS SCREEN ─────────────────────────────────────────────────────
function KomunitasScreen({ onNavigate, initialTab = 'doa' }) {
  const [activeTab, setActiveTab] = us(initialTab);
  const [visible, setVisible] = us(true);
  const [displayTab, setDisplayTab] = us(initialTab);

  const [prayers, setPrayers] = us([...PRAYERS_INITIAL, ...PRAYERS_ANSWERED]);
  const [amined, setAmined] = us(new Set([2, 4]));
  const [confirmAnswer, setConfirmAnswer] = us(null);
  const [createOpen, setCreateOpen] = us(false);

  const [verses, setVerses] = us(COMMUNITY_VERSES.map(v => ({ ...v, gemad: false })));
  const [shareVerseOpen, setShareVerseOpen] = us(false);

  function switchTab(id) {
    if (id === activeTab) return;
    setVisible(false);
    setTimeout(() => { setDisplayTab(id); setActiveTab(id); setVisible(true); }, 80);
  }

  function toggleAmin(id) {
    setAmined(s => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
        setPrayers(p => p.map(x => x.id === id ? { ...x, likes: x.likes - 1 } : x));
      } else {
        n.add(id);
        setPrayers(p => p.map(x => x.id === id ? { ...x, likes: x.likes + 1 } : x));
      }
      return n;
    });
  }

  function markAnswered(id, testimony) {
    setPrayers(p => p.map(x => x.id === id ? { ...x, answered: true, testimony } : x));
    setConfirmAnswer(null);
  }

  function handleCreate(text, category, anonymous) {
    const name = anonymous ? 'Anonim' : ME.name;
    const ranting = anonymous ? '' : ME.ranting;
    setPrayers(p => [{ id: Date.now(), name, ranting, text, minsAgo: 0, likes: 0, own: true, answered: false, category }, ...p]);
    setCreateOpen(false);
  }

  function toggleGema(id) {
    setVerses(vs => vs.map(v => v.id === id ? { ...v, gemad: !v.gemad } : v));
  }

  function handleShareVerse(verse) {
    setVerses(vs => [{
      id: Date.now(),
      book: verse.book, c: verse.c, v: verse.v, text: verse.t,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      sharedBy: ME.name, ranting: ME.ranting,
      gema: 0, pinned: false, gemad: false,
    }, ...vs]);
    setShareVerseOpen(false);
  }

  return (
    <>
      <Header
        title="Komunitas"
        subtitle="Berdoa dan berbagi firman bersama"
        trailing={<IdChip onSignOut={() => onNavigate('signin')} />}
      />

      <div className="vq-scroll" style={{ paddingBottom: 100, position: 'relative' }}>
        <div className="vq-grain" />

        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <SubTabBar
            tabs={[{ id: 'doa', label: 'Doa Wall' }, { id: 'ayat', label: 'Ayat Bersama' }]}
            active={activeTab}
            onChange={switchTab}
          />
        </div>

        <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 80ms' }}>
          {displayTab === 'doa' ? (
            <DoaWallTab
              prayers={prayers}
              amined={amined}
              onToggleAmin={toggleAmin}
              onSetConfirm={setConfirmAnswer}
            />
          ) : (
            <AyatBersamaTab verses={verses} onToggleGema={toggleGema} />
          )}
        </div>
      </div>

      <button
        className="vq-fab vq-tap"
        aria-label={activeTab === 'doa' ? 'Tambah doa' : 'Bagikan ayat'}
        onClick={() => activeTab === 'doa' ? setCreateOpen(true) : setShareVerseOpen(true)}
      >
        <GPlus color="#fff" size={26} />
      </button>

      {createOpen && <CreatePrayerModal onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />}
      {shareVerseOpen && <ShareVerseModal onClose={() => setShareVerseOpen(false)} onSubmit={handleShareVerse} />}
      {confirmAnswer && (
        <TestimonySheet
          onClose={() => setConfirmAnswer(null)}
          onSubmit={testimony => markAnswered(confirmAnswer, testimony)}
        />
      )}
    </>
  );
}

// ─── PRAYER WALL (legacy artboard) ───────────────────────────────────────
function PrayerWall({ onNavigate }) {
  const [prayers, setPrayers] = us(PRAYERS_INITIAL);
  const [liked, setLiked] = us(new Set([2, 4]));
  const [createOpen, setCreateOpen] = us(false);
  const [confirmAnswer, setConfirmAnswer] = us(null);

  function toggleLike(id) {
    setLiked((s) => {
      const n = new Set(s);
      if (n.has(id)) {n.delete(id);setPrayers((p) => p.map((x) => x.id === id ? { ...x, likes: x.likes - 1 } : x));} else
      {n.add(id);setPrayers((p) => p.map((x) => x.id === id ? { ...x, likes: x.likes + 1 } : x));}
      return n;
    });
  }

  function handleAnswered(id) {
    setPrayers((p) => p.map((x) => x.id === id ? { ...x, answered: true } : x));
    setConfirmAnswer(null);
  }

  function handleCreate(text) {
    setPrayers((p) => [{ id: Date.now(), name: ME.name, ranting: ME.ranting, text, minsAgo: 0, likes: 0, own: true, answered: false }, ...p]);
    setCreateOpen(false);
  }

  return (
    <>
      <Header
        title="Tembok Doa"
        subtitle="Saling mendoakan, saling menguatkan"
        trailing={<IdChip onSignOut={() => onNavigate('signin')} />} />
      
      <div className="vq-scroll" style={{ paddingBottom: 100, paddingTop: 16, position: 'relative' }}>
        <div className="vq-grain" />
        <div style={{ padding: '0 var(--space-page-x)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {prayers.filter((p) => !p.answered).map((p) => {
            const isLiked = liked.has(p.id);
            const showConfirm = confirmAnswer === p.id;
            return (
              <div key={p.id} className={`vq-card ${p.own ? 'own' : ''}`} style={{ position: 'relative' }}>
                {p.own && <span className="vq-badge primary" style={{ position: 'absolute', top: 12, right: 12 }}>Doamu</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingRight: p.own ? 70 : 0 }}>
                  <div className="vq-avatar">{p.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.ranting} · {relTime(p.minsAgo)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-body)' }}>{p.text}</div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button className={`vq-pill vq-tap ${isLiked ? 'active' : ''}`}
                  onClick={() => toggleLike(p.id)}
                  style={{ color: 'var(--color-primary)' }}>
                    <GHeart size={14} filled={isLiked} />
                    <span className="lbl">{isLiked ? 'Amin' : 'Amin'} · {p.likes}</span>
                  </button>
                  {p.own && !showConfirm &&
                  <button className="vq-pill vq-tap" onClick={() => setConfirmAnswer(p.id)}
                  style={{ background: 'var(--color-success-bg)', borderColor: "rgb(59, 149, 101)", backgroundColor: "rgb(24, 42, 24)", color: "rgb(211, 250, 225)" }}>
                      <GSparkle size={14} /> <span className="lbl">Doa Terjawab</span>
                    </button>
                  }
                  {p.own && showConfirm &&
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Tandai terjawab?</span>
                      <button className="vq-pill vq-tap active" onClick={() => handleAnswered(p.id)}
                    style={{ color: 'var(--color-success)', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                        <span className="lbl">Ya</span>
                      </button>
                      <button className="vq-pill vq-tap" onClick={() => setConfirmAnswer(null)}
                    style={{ color: 'var(--color-text-muted)' }}>
                        <span className="lbl">Batal</span>
                      </button>
                    </div>
                  }
                </div>
              </div>);

          })}
        </div>
      </div>

      <button className="vq-fab vq-tap" aria-label="Tambah doa" onClick={() => setCreateOpen(true)}>
        <GPlus color="#fff" size={26} />
      </button>

      {createOpen && <CreatePrayerModal onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />}
    </>);

}

// ─── CREATE PRAYER MODAL ─────────────────────────────────────────────────
function CreatePrayerModal({ onClose, onSubmit }) {
  const [text, setText] = us('');
  const [category, setCategory] = us('Pribadi');
  const [showName, setShowName] = us(true);
  const [submitting, setSubmitting] = us(false);
  const max = 500;
  const tooLong = text.length > max;
  const nearLimit = text.length >= 450;
  const CATS = ['Pribadi', 'Keluarga', 'Kesehatan', 'Pelayanan', 'Syukur'];

  function submit() {
    if (!text.trim() || tooLong) return;
    setSubmitting(true);
    setTimeout(() => onSubmit(text.trim(), category, !showName), 500);
  }

  return (
    <>
      <div className="vq-modal-backdrop" onClick={onClose} />
      <div className="vq-sheet" onClick={e => e.stopPropagation()}>
        <div className="vq-sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>Tulis Permintaan Doa</div>
          <button onClick={onClose} className="vq-tap" aria-label="Tutup" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 22, padding: 4 }}>×</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Kategori</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATS.map(cat => {
              const isActive = cat === category;
              return (
                <button key={cat} onClick={() => setCategory(cat)} className="vq-tap" style={{
                  height: 30, padding: '0 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid var(--color-border)',
                  background: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'background 0.12s, color 0.12s',
                }}>{cat}</button>
              );
            })}
          </div>
        </div>

        <textarea
          className="vq-textarea"
          placeholder="Ceritakan permintaan doamu, sesingkat atau sepanjang yang kamu butuhkan..."
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={max + 50}
          autoFocus
        />

        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Komunitasmu akan saling mendoakan.</span>
          <span className="vq-mono" style={{ color: nearLimit ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
            {text.length} / {max}
          </span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--color-bg-muted)', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Tampilkan namaku</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
              {showName ? `Akan muncul sebagai "${ME.name}"` : 'Akan muncul sebagai "Anonim"'}
            </div>
          </div>
          <button onClick={() => setShowName(!showName)} className="vq-tap" aria-pressed={showName} style={{
            position: 'relative', width: 46, height: 26, borderRadius: 999,
            background: showName ? 'var(--color-primary)' : 'var(--color-border)',
            border: 'none', cursor: 'pointer', transition: 'background 0.15s ease',
          }}>
            <i style={{
              position: 'absolute', top: 3, left: showName ? 23 : 3,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.15s ease', display: 'block',
            }} />
          </button>
        </div>

        <button className="vq-cta vq-tap" disabled={!text.trim() || tooLong || submitting}
          onClick={submit} style={{ marginTop: 16 }}>
          {submitting ? 'Mengirim...' : 'Kirim Doa'}
        </button>
      </div>
    </>
  );
}

// ─── SHARE VERSE MODAL ───────────────────────────────────────────────────
function ShareVerseModal({ onClose, onSubmit }) {
  const [selected, setSelected] = us(null);
  const [submitting, setSubmitting] = us(false);
  const passage = SCHEDULE.passage;

  function submit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    const verse = passage.find(r => r.v === selected);
    setTimeout(() => onSubmit({ ...verse, book: SCHEDULE.book }), 400);
  }

  return (
    <>
      <div className="vq-modal-backdrop" onClick={onClose} />
      <div className="vq-sheet" onClick={e => e.stopPropagation()}>
        <div className="vq-sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>Bagikan Ayat</div>
          <button onClick={onClose} className="vq-tap" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 22, padding: 4 }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          Pilih satu ayat dari {SCHEDULE.book} 23 untuk dibagikan ke komunitas.
        </div>

        <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {passage.map(row => {
            const isSel = selected === row.v;
            return (
              <button
                key={row.v}
                onClick={() => setSelected(isSel ? null : row.v)}
                className="vq-tap"
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-text-body)',
                  background: isSel ? 'var(--color-primary-soft)' : 'transparent',
                  border: isSel ? '1px solid var(--color-primary-border)' : '1px solid transparent',
                  borderLeft: isSel ? '3px solid var(--color-primary)' : '3px solid transparent',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
              >
                <span className="vq-mono" style={{ color: 'var(--color-primary)', fontWeight: 700, marginRight: 6, fontSize: 11 }}>
                  {row.c}:{row.v}
                </span>
                {row.t}
              </button>
            );
          })}
        </div>

        <button className="vq-cta vq-tap" disabled={!selected || submitting} onClick={submit}>
          {submitting ? 'Membagikan...' : 'Bagikan ke Komunitas'}
        </button>
      </div>
    </>
  );
}

// ─── COORDINATOR / ABSENSI ───────────────────────────────────────────────
function CoordinatorScreen({ onNavigate, pendingCount }) {
  const [doneOpen, setDoneOpen] = us(false);
  const list = um(() => {
    const not = MEMBERS_ALL.filter((x) => !x.submitted).slice(0, pendingCount);
    const sub = MEMBERS_ALL.filter((x) => x.submitted);
    return { not, sub };
  }, [pendingCount]);

  return (
    <>
      <Header
        title="Absensi"
        subtitle="Lihat siapa belum submit hari ini"
        showBack onBack={() => onNavigate('home')}
        trailing={<IdChip onSignOut={() => onNavigate('signin')} />} />
      
      <div className="vq-scroll" style={{ paddingBottom: 100, paddingTop: 16, position: 'relative' }}>
        <div className="vq-grain" />
        <div style={{ padding: '0 var(--space-page-x)' }}>
          {/* Counts */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <div style={{ flex: 1, padding: 12, borderRadius: 12, background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-danger-text, #B91C1C)', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.85 }}>Belum Submit</div>
              <div className="vq-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-danger-text, #B91C1C)', marginTop: 2 }}>{list.not.length}</div>
            </div>
            <div style={{ flex: 1, padding: 12, borderRadius: 12, background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success-text, #15803D)', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.85 }}>Sudah Submit</div>
              <div className="vq-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-success-text, #15803D)', marginTop: 2 }}>{list.sub.length}</div>
            </div>
          </div>

          {list.not.length > 0 &&
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
              Sapa lewat WhatsApp
            </div>
          }
          {list.not.length === 0 ?
          <div className="vq-card" style={{ background: 'var(--color-success-bg)', borderColor: 'var(--color-success-border)', textAlign: 'center', padding: 24 }}>
              <div style={{ width: 48, height: 48, margin: '0 auto 10px', borderRadius: '50%', background: 'var(--color-success-border)', opacity: 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GCheck size={26} stroke={2.5} color="var(--color-success-text)" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-display)' }}>Semua sudah submit!</div>
              <div style={{ fontSize: 13, color: 'var(--color-success-text)', opacity: 0.85, marginTop: 4 }}>Tugasmu hari ini selesai. Tuhan memberkati.</div>
            </div> :

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.not.map((m) =>
            <div key={m.name} className="vq-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: "rgb(26, 24, 34)" }}>
                  <div className="vq-avatar">{m.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.name}</div>
                  <a href="#" onClick={(e) => e.preventDefault()} aria-label={`WhatsApp ${m.name}`} className="vq-tap" style={{
                width: 40, height: 40, borderRadius: '50%', background: 'var(--color-wa-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
                opacity: 0.92, backgroundColor: "rgb(20, 44, 31)"
              }}>
                    <GWhatsApp size={18} color="#fff" />
                  </a>
                </div>
            )}
            </div>
          }

          <button onClick={() => setDoneOpen(!doneOpen)} className="vq-tap" style={{
            marginTop: 18, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent', border: 'none', padding: '10px 4px', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-body)'
          }}>
            <span>Sudah submit ({list.sub.length})</span>
            <span style={{ transform: doneOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><GChevronR /></span>
          </button>
          {doneOpen &&
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {list.sub.map((m) =>
            <div key={m.name} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 12, background: 'var(--color-bg-muted)', opacity: 0.75
            }}>
                  <GCheck size={16} stroke={2.5} color="var(--color-success-text)" />
                  <span style={{ fontSize: 13.5, color: 'var(--color-text-secondary)' }}>{m.name}</span>
                </div>
            )}
            </div>
          }
        </div>
      </div>
    </>);

}

// ─── PRD-004: Devotional helpers ─────────────────────────────────────────

const DEVOTIONAL_DATE = '2026-05-05';
const DEVOTIONAL_TITLE = 'Tuhan, gembala yang tidak pernah lengah.';
const VERSE_TEXT = '"TUHAN adalah gembalaku, takkan kekurangan aku."';
const VERSE_REF = 'Mazmur 23:1';
const REFLEKSI_Q = 'Apa satu hal kecil hari ini yang bisa kamu percayakan kepada Tuhan, sebagai latihan untuk percaya pada hal yang lebih besar?';
const DEVOTIONAL_PARAS = [
  { key: 'p0', text: 'Daud menulis mazmur ini bukan dari kursi nyaman, tapi dari ladang yang panas dan malam yang dingin. Ia tahu betul bagaimana seekor domba bergantung penuh pada gembalanya.' },
  { key: 'p1', text: 'Hari ini, di tengah hal-hal yang kamu hadapi — tugas yang menumpuk, hubungan yang rumit, masa depan yang belum jelas — kalimat sederhana ini bisa jadi pegangan: aku tidak akan kekurangan.' },
  { key: 'p2', text: 'Bukan karena semuanya akan mudah, tapi karena Yang menggembalakanmu tidak pernah lengah.' },
];
const HL_COLOR_MAP = { '#FDE68A': 'rgba(253,230,138,0.8)', '#BBF7D0': 'rgba(187,247,208,0.8)', '#C4B5FD': 'rgba(196,181,253,0.8)' };
const FS_MAP = { small: 14, medium: 15.5, large: 18 };

function loadDevotionalState() {
  try {
    return {
      hl: JSON.parse(localStorage.getItem(`vq_hl_${DEVOTIONAL_DATE}`)) || {},
      notes: JSON.parse(localStorage.getItem(`vq_notes_${DEVOTIONAL_DATE}`)) || {},
      prefs: JSON.parse(localStorage.getItem('vq_reader_prefs')) || {},
    };
  } catch { return { hl: {}, notes: {}, prefs: {} }; }
}

function RefleksiBlock({ note, onAnswer }) {
  return (
    <div style={{ marginTop: 22, marginBottom: 8, padding: 16, borderRadius: 14, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Refleksi</div>
      <div style={{ fontSize: 14, color: 'var(--color-text-body)', lineHeight: 1.6, marginBottom: 14 }}>{REFLEKSI_Q}</div>
      {note ? (
        <>
          <div style={{ padding: '10px 12px', background: 'var(--color-bg-muted)', borderRadius: 10, marginBottom: 8, fontSize: 14, color: 'var(--color-text-body)', lineHeight: 1.55 }}>{note.text}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GPencil size={11} color="var(--color-text-muted)"/>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{relTime(Math.floor((Date.now() - note.savedAt) / 60000))} lalu</span>
            <button className="vq-tap" onClick={onAnswer} style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', fontFamily: 'var(--font-body)' }}>Edit</button>
          </div>
        </>
      ) : (
        <button className="vq-pill vq-tap" onClick={onAnswer} style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
          <GPlus size={14}/> <span className="lbl">Jawab</span>
        </button>
      )}
    </div>
  );
}

function ShareSheet({ onClose }) {
  function doShare(type) {
    const text = type === 'verse'
      ? `${VERSE_TEXT} — ${VERSE_REF}`
      : `${DEVOTIONAL_TITLE}\n\n${VERSE_TEXT} — ${VERSE_REF}\n\nDibaca di VerseQuest`;
    if (navigator.share) { navigator.share({ text }).catch(() => {}); } else { navigator.clipboard?.writeText(text); }
    onClose();
  }
  const Row = ({ icon, title, sub, type }) => (
    <button className="vq-tap" onClick={() => doShare(type)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', width: '100%', textAlign: 'left' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
  return (
    <>
      <div className="vq-modal-backdrop" onClick={onClose}/>
      <div className="vq-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="vq-sheet-handle"/>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>Bagikan</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row icon={<GBook size={20} color="var(--color-primary)"/>} title="Bagikan Ayat" sub="Kirim teks ayat + referensi" type="verse"/>
          <Row icon={<GShare size={20} color="var(--color-primary)"/>} title="Bagikan Renungan" sub="Kirim judul + kutipan + link" type="devotional"/>
        </div>
        <button className="vq-tap" onClick={onClose} style={{ marginTop: 14, width: '100%', padding: 12, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Batalkan</button>
      </div>
    </>
  );
}

// ─── DEVOTIONAL READER (revamped — PRD-004) ───────────────────────────────
function DevotionalScreen({ onNavigate, taskState, setTaskState }) {
  const init = loadDevotionalState();
  const [settingsOpen, setSettingsOpen] = us(false);
  const [shareOpen, setShareOpen] = us(false);
  const [activeEl, setActiveEl] = us(null);
  const [noteSheet, setNoteSheet] = us(null);
  const [hl, setHl] = us(init.hl);
  const [notes, setNotes] = us(init.notes);
  const [prefs, setPrefs] = us({ fontSize: 'medium', theme: 'light', ...init.prefs });

  ue(() => { try { localStorage.setItem(`vq_hl_${DEVOTIONAL_DATE}`, JSON.stringify(hl)); } catch {} }, [JSON.stringify(hl)]);
  ue(() => { try { localStorage.setItem(`vq_notes_${DEVOTIONAL_DATE}`, JSON.stringify(notes)); } catch {} }, [JSON.stringify(notes)]);
  ue(() => { try { localStorage.setItem('vq_reader_prefs', JSON.stringify(prefs)); } catch {} }, [JSON.stringify(prefs)]);

  ue(() => {
    if (!activeEl) return;
    function dismiss(e) { if (!e.target.closest('.vq-hl-para')) setActiveEl(null); }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [activeEl]);

  function applyHl(color) { setHl((h) => ({ ...h, [activeEl]: color })); setActiveEl(null); }
  function removeHl(key) { setHl((h) => { const n = { ...h }; delete n[key]; return n; }); setActiveEl(null); }
  function openNote(anchor, snippet) { setActiveEl(null); setNoteSheet({ anchor, snippet }); }
  function saveNote(text) { if (!noteSheet) return; setNotes((n) => ({ ...n, [noteSheet.anchor]: { text, savedAt: Date.now() } })); setNoteSheet(null); }

  const bodyFs = FS_MAP[prefs.fontSize] || 15.5;
  const sepia = prefs.theme === 'sepia';
  const sepiaVars = sepia ? { background: '#FDF6E3', '--color-text-body': '#3B2F2F', '--color-text-primary': '#2A1F1F', '--color-bg-card': '#FAEFD5', '--color-bg-muted': '#F0E0BC', '--color-border': '#E8D5B0', '--color-primary': '#8B6914', '--color-primary-soft': '#F5EAC8' } : {};

  return (
    <>
      {/* HEADER */}
      <div className="vq-header" style={{ position: 'relative', zIndex: 55 }}>
        <div className="vq-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button className="vq-tap" onClick={() => onNavigate('home')} aria-label="Kembali" style={{ background: 'transparent', border: 'none', padding: 4, marginLeft: -4, cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
              <GBack size={22}/>
            </button>
            <div>
              <div className="vq-title">Renungan Pagi</div>
              <div className="vq-subtitle">Selasa, 5 Mei 2026</div>
            </div>
          </div>
          {/* Trailing icon cluster */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[
              { icon: <GBoltSmall size={16}/>, action: () => setSettingsOpen((o) => !o), on: settingsOpen, label: 'Pengaturan' },
              { icon: <GArchive size={18}/>, action: () => onNavigate('library'), on: false, label: 'Perpustakaan' },
              { icon: <GShare size={18}/>, action: () => { setActiveEl(null); setShareOpen(true); }, on: false, label: 'Bagikan' },
            ].map(({ icon, action, on, label }) => (
              <button key={label} className="vq-tap" onClick={action} aria-label={label} style={{ background: on ? 'var(--color-primary-soft)' : 'transparent', border: 'none', padding: 8, borderRadius: 10, cursor: 'pointer', color: on ? 'var(--color-primary)' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>{icon}</button>
            ))}
          </div>
        </div>

        {settingsOpen && (
          <ReaderSettingsPanel
            prefs={prefs}
            onChange={(k, v) => setPrefs((p) => ({ ...p, [k]: v }))}
          />
        )}
      </div>

      {/* SCROLL BODY */}
      <div
        className="vq-scroll"
        style={{ paddingBottom: 110, paddingTop: 8, position: 'relative', ...sepiaVars }}
        onClick={() => { if (settingsOpen) setSettingsOpen(false); }}
      >
        <div className="vq-grain"/>
        <article className="vq-reader-article" style={{ padding: '14px var(--space-page-x) 0', fontSize: bodyFs, lineHeight: 1.72 }}>
          <div className="vq-badge soft" style={{ marginBottom: 12 }}>{SCHEDULE.book} 23:1</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: Math.round(bodyFs * 1.78), fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2, letterSpacing: -0.01, margin: 0, textWrap: 'balance' }}>
            {DEVOTIONAL_TITLE}
          </h2>

          <blockquote style={{ margin: '20px 0 0', padding: '14px 18px', borderLeft: '3px solid var(--color-primary)', background: 'var(--color-primary-soft)', borderRadius: '0 12px 12px 0' }}>
            <div className="vq-quote" style={{ fontStyle: 'italic' }}>{VERSE_TEXT}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-primary)', fontWeight: 700 }}>{VERSE_REF}</div>
          </blockquote>

          {/* Highlightable paragraphs */}
          <div style={{ marginTop: 18, color: 'var(--color-text-body)' }}>
            {DEVOTIONAL_PARAS.map(({ key, text }) => {
              const hlColor = hl[key];
              const note = notes[key];
              const isActive = activeEl === key;
              return (
                <div key={key} className="vq-hl-para" style={{ position: 'relative', marginBottom: 14 }}>
                  <p
                    style={{ margin: 0, background: hlColor ? HL_COLOR_MAP[hlColor] || hlColor : 'transparent', borderRadius: hlColor ? 6 : 0, padding: hlColor ? '4px 6px' : 0, cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', outline: isActive ? '2px solid var(--color-primary)' : 'none', outlineOffset: 3, transition: 'background 0.15s, outline 0.1s' }}
                    onClick={() => setActiveEl(isActive ? null : key)}
                  >{text}</p>
                  {note && !isActive && (
                    <span onClick={() => openNote(key, text.slice(0, 90) + (text.length > 90 ? '…' : ''))} title="Lihat catatan" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', marginLeft: 5, verticalAlign: 'middle', cursor: 'pointer' }}/>
                  )}
                  {isActive && (
                    <HighlightToolbar
                      hasHighlight={!!hlColor}
                      onColor={applyHl}
                      onNote={() => openNote(key, text.slice(0, 90) + (text.length > 90 ? '…' : ''))}
                      onRemove={() => removeHl(key)}
                      onDismiss={() => setActiveEl(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <RefleksiBlock note={notes['refleksi']} onAnswer={() => openNote('refleksi', REFLEKSI_Q)}/>

          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', padding: '4px 0 6px', letterSpacing: 0.2 }}>
            Ketuk paragraf untuk menandai atau mencatat
          </div>
        </article>
      </div>

      {/* STICKY CTA */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px var(--space-page-x) 16px', background: 'color-mix(in oklab, var(--color-bg-card) 92%, transparent)', backdropFilter: 'blur(14px)', borderTop: '1px solid var(--color-border)', zIndex: 30 }}>
        <button className="vq-cta vq-tap" disabled={taskState.devotion}
          onClick={() => { setTaskState((s) => ({ ...s, devotion: true })); setTimeout(() => onNavigate('home'), 600); }}
          style={{ background: taskState.devotion ? 'var(--color-success)' : 'var(--color-primary)' }}>
          {taskState.devotion ? <><GCheck color="#fff" stroke={2.5}/> Sudah dibaca</> : 'Tandai sudah dibaca'}
        </button>
      </div>

      {noteSheet && <NoteSheet snippet={noteSheet.snippet} initialNote={notes[noteSheet.anchor]?.text || ''} onSave={saveNote} onClose={() => setNoteSheet(null)}/>}
      {shareOpen && <ShareSheet onClose={() => setShareOpen(false)}/>}
    </>
  );
}

// ─── PRD-004: Perpustakaan (Library) ──────────────────────────────────────
const LIBRARY_SEED = [
  { id: 's1', date: '5 Mei 2026',  ref: 'Mazmur 23:1',  title: 'Tuhan, gembala yang tidak pernah lengah.',      hlCount: 2, noteCount: 1 },
  { id: 's2', date: '4 Mei 2026',  ref: 'Roma 8:28',     title: 'Segala sesuatu bekerja bersama untuk kebaikan.', hlCount: 1, noteCount: 0 },
  { id: 's3', date: '3 Mei 2026',  ref: 'Filipi 4:13',   title: 'Segala perkara dapat kutanggung di dalam Dia.',  hlCount: 0, noteCount: 1 },
  { id: 's4', date: '2 Mei 2026',  ref: 'Yeremia 29:11', title: 'Rancangan damai sejahtera dan bukan kecelakaan.', hlCount: 3, noteCount: 2 },
  { id: 's5', date: '1 Mei 2026',  ref: 'Yohanes 3:16',  title: 'Karena begitu besar kasih Allah akan dunia ini.', hlCount: 0, noteCount: 1 },
  { id: 's6', date: '30 Apr 2026', ref: 'Mazmur 46:1',   title: 'Allah itu bagi kita tempat perlindungan.',        hlCount: 1, noteCount: 0 },
  { id: 's7', date: '29 Apr 2026', ref: 'Yesaya 40:31',  title: 'Mereka yang menantikan Tuhan mendapat kekuatan.', hlCount: 2, noteCount: 1 },
];

function LibraryScreen({ onNavigate }) {
  const [search, setSearch] = us('');

  const grouped = um(() => {
    const filtered = LIBRARY_SEED.filter((e) =>
      !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.ref.toLowerCase().includes(search.toLowerCase())
    );
    const map = {};
    filtered.forEach((e) => {
      const month = e.date.split(' ').slice(1).join(' ');
      if (!map[month]) map[month] = [];
      map[month].push(e);
    });
    return Object.entries(map);
  }, [search]);

  return (
    <>
      <Header title="Perpustakaan" subtitle="Renungan tersimpan" showBack onBack={() => onNavigate('devotional')}/>
      <div className="vq-scroll" style={{ paddingBottom: 40, paddingTop: 12, position: 'relative' }}>
        <div className="vq-grain"/>
        <div style={{ padding: '0 var(--space-page-x)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="vq-input" placeholder="Cari renungan atau referensi..." value={search} onChange={(e) => setSearch(e.target.value)}/>
          {grouped.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>Tidak ada hasil untuk "{search}"</div>}
          {grouped.map(([month, entries]) => (
            <div key={month}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8, marginTop: 4 }}>{month}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries.map((e) => (
                  <LibraryCard key={e.id} date={e.date} reference={e.ref} titleSnippet={e.title} hlCount={e.hlCount} noteCount={e.noteCount} onTap={() => onNavigate('devotional')}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── COMMUNITY VERSES ────────────────────────────────────────────────────
function CommunityScreen({ onNavigate }) {
  return (
    <>
      <Header
        title="Komunitas"
        subtitle="Ayat yang dipilih anggota lain hari ini"
        trailing={<IdChip onSignOut={() => onNavigate('signin')} />} />
      
      <div className="vq-scroll" style={{ paddingBottom: 100, paddingTop: 16, position: 'relative' }}>
        <div className="vq-grain" />
        <div style={{ padding: '0 var(--space-page-x)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {COMMUNITY_VERSES.map((it, i) =>
          <div key={i} className="vq-card" style={{ position: 'relative' }}>
              <div aria-hidden style={{ position: 'absolute', top: 10, right: 14, fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, color: 'var(--color-primary)', opacity: 0.1, fontWeight: 700, pointerEvents: 'none' }}>
                &ldquo;
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="vq-badge soft" style={{ whiteSpace: 'nowrap' }}>{it.book} {it.c}:{it.v}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{it.date}</span>
              </div>
              <div className="vq-quote">{it.text}</div>
            </div>
          )}
        </div>
      </div>
    </>);

}

// ─── PHONE SIGN-IN ───────────────────────────────────────────────────────
function SignInScreen({ onNavigate }) {
  const [phone, setPhone] = us('');
  const [loading, setLoading] = us(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div className="vq-grain" />
      <div style={{ flex: 1, padding: '60px 28px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GCross size={22} color="#fff" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Verse<span style={{ color: 'var(--color-primary)' }}>Quest</span>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.18, margin: '8px 0 8px', letterSpacing: -0.02, textWrap: 'balance' }}>
          {'Selamat datang.\nMulai ritmemu setiap pagi.'}
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: 0 }}>
          Login dengan nomor WhatsApp yang sudah didaftarkan oleh koordinator rantingmu.
        </p>

        <div style={{ marginTop: 28 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Nomor WhatsApp</label>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'stretch', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              background: '#FAFAFF', color: 'var(--color-text-primary)',
              fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', flexShrink: 0
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>🇮🇩</span>
              <span>+62</span>
            </div>
            <input className="vq-input" inputMode="tel" value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 13))}
            placeholder="812 3456 7890" style={{ flex: 1 }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Belum terdaftar? Hubungi koordinator rantingmu.
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 28px 32px' }}>
        <button className="vq-cta vq-tap"
        disabled={loading || phone.length < 9}
        onClick={() => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            onNavigate('home');
          }, 600);
        }}>
          {loading ? 'Sebentar...' : 'Masuk'}
        </button>
        <div style={{ marginTop: 14, fontSize: 11, textAlign: 'center', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Dengan masuk, kamu menyetujui Syarat & Kebijakan Privasi VerseQuest.
        </div>
      </div>
    </div>);

}

// ─── ONBOARDING / PHONE REGISTRATION ────────────────────────────────────
function PhoneRegistrationScreen({ onNavigate }) {
  const [step, setStep] = us(0); // 0-2 = slides; 3 = phone entry
  const [phone, setPhone] = us('');
  const [loading, setLoading] = us(false);

  const slides = [
    { icon: <GFlame size={40} color="var(--color-primary)" />, headline: 'Satu ayat setiap pagi.', sub: 'Mulai harimu dengan firman yang hidup.' },
    { icon: <GPray size={40} color="var(--color-primary)" />, headline: 'Berdoa bersama komunitas.', sub: 'Kiriman doa dari ranting yang saling menguatkan.' },
    { icon: <GSparkle size={40} color="var(--color-primary)" />, headline: 'Pantau perjalanan imanmu.', sub: 'Streak, misi harian, dan renungan pagi.' },
  ];

  if (step === 3) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        <div className="vq-grain" />
        <div style={{ flex: 1, padding: '60px 28px 0', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GCross size={22} color="#fff" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              Verse<span style={{ color: 'var(--color-primary)' }}>Quest</span>
            </div>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.18, margin: '8px 0 8px', letterSpacing: -0.02, textWrap: 'balance' }}>
            Daftarkan nomormu.
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: 0 }}>
            Masukkan nomor WhatsApp yang sudah didaftarkan oleh koordinator rantingmu.
          </p>

          <div style={{ marginTop: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Nomor WhatsApp</label>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'stretch', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                background: '#FAFAFF', color: 'var(--color-text-primary)',
                fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', flexShrink: 0,
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>🇮🇩</span>
                <span>+62</span>
              </div>
              <input className="vq-input" inputMode="tel" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 13))}
              placeholder="812 3456 7890" style={{ flex: 1 }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
              Belum terdaftar? Hubungi koordinator rantingmu.
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 28px 32px' }}>
          <button className="vq-cta vq-tap" disabled={loading || phone.length < 9}
          onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); onNavigate('home'); }, 600); }}>
            {loading ? 'Sebentar...' : 'Daftar & Masuk'}
          </button>
          <button onClick={() => onNavigate('signin')} className="vq-tap"
          style={{ marginTop: 10, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)', padding: '8px 0', fontFamily: 'var(--font-body)' }}>
            Sudah punya akun? Masuk
          </button>
        </div>
      </div>);
  }

  const slide = slides[step];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div className="vq-grain" />

      <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 10 }}>
        <button onClick={() => setStep(3)} className="vq-tap"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', padding: '8px 4px', fontFamily: 'var(--font-body)' }}>
          Lewati
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', position: 'relative' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          {slide.icon}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2, letterSpacing: -0.01, textAlign: 'center', textWrap: 'balance', marginBottom: 12 }}>
          {slide.headline}
        </div>
        <div style={{ fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.55, textAlign: 'center' }}>
          {slide.sub}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 20 }}>
        {slides.map((_, i) =>
        <div key={i} style={{ height: 6, width: i === step ? 18 : 6, borderRadius: 3, background: i === step ? 'var(--color-primary)' : 'var(--color-border)', transition: 'width 0.2s ease, background 0.2s ease' }} />
        )}
      </div>

      <div style={{ padding: '0 28px 32px' }}>
        <button className="vq-cta vq-tap" onClick={() => setStep(step < slides.length - 1 ? step + 1 : 3)}>
          {step < slides.length - 1 ? 'Lanjut' : 'Mulai'}
        </button>
      </div>
    </div>);
}

// ─── BOTTOM NAV — floating island ────────────────────────────────────────
function BottomNav({ active, onNavigate, isCoordinator, pendingCount = 0 }) {
  const items = [
    { id: 'home',      label: 'Beranda',   Glyph: GHome },
    { id: 'komunitas', label: 'Komunitas', Glyph: GUsers },
    { id: 'doa',       label: 'Doa',       Glyph: GPray },
  ];
  if (isCoordinator) items.push({ id: 'coordinator', label: 'Absensi', Glyph: GCheckCircle });

  return (
    <nav className="vq-bottomnav" role="navigation" aria-label="Navigasi utama">
      {items.map(({ id, label, Glyph }) => {
        const isActive = active === id ||
          (id === 'komunitas' && (active === 'prayer' || active === 'community')) ||
          (id === 'doa'       && active === 'prayer');
        const hasBadge = id === 'coordinator' && pendingCount > 0;
        return (
          <button
            key={id}
            className={`vq-navitem vq-tap${isActive ? ' active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={isActive ? 'page' : undefined}
          >
            {hasBadge && <span className="vq-navitem-badge" aria-label={`${pendingCount} belum submit`}/>}
            <Glyph
              size={isActive ? 24 : 22}
              color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
              filled={isActive}
            />
            <span className="vq-navitem-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

Object.assign(window, {
  HomeScreen, KomunitasScreen, SubTabBar, CategoryFilter,
  PrayerCard, TestimonySheet, DoaWallTab, AyatBersamaTab,
  PrayerWall, CreatePrayerModal, ShareVerseModal,
  CoordinatorScreen, DevotionalScreen, LibraryScreen, CommunityScreen,
  SignInScreen, PhoneRegistrationScreen, BottomNav,
});