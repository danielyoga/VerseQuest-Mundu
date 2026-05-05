/* global React, GBook, GCross, GHands, GHeart, GCheck, GFlame, GSparkle, GBack, GChevronR, GHome, GUsers, GPray, GCheckCircle, GPlus, GPhone, GWhatsApp, GMoon, GBoltSmall, GClock, GLogout, ME, SCHEDULE, PRAYERS_INITIAL, MEMBERS_ALL, COMMUNITY_VERSES, relTime, bookName, Header, IdChip, StreakHero, QuestCard, SubmitBanner, ReadingCard */

const { useState: us, useEffect: ue, useMemo: um } = React;

// ─── HOME SCREEN ─────────────────────────────────────────────────────────
function HomeScreen({ tweaks, onNavigate, taskState, setTaskState, onSubmitVerse }) {
  const submitted = taskState.verse;
  const totalQuests = 4;
  const doneQuests = (taskState.verse ? 1 : 0) + (taskState.devotion ? 1 : 0) + (taskState.firman ? 1 : 0) + (taskState.gratitude ? 1 : 0);
  const progress = doneQuests / totalQuests * 100;

  const order = tweaks.dashboardOrder; // 'quests_first' | 'reading_first'

  const questsBlock =
  <div>
      <div style={{ padding: '0 var(--space-page-x)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Misi Hari Ini</div>
        <div className="vq-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{doneQuests}/{totalQuests}</div>
      </div>
      <div style={{ margin: '0 var(--space-page-x) 14px', height: 6, background: 'var(--color-bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))', transition: 'width 0.5s ease' }} />
      </div>

      <QuestCard
      icon={<GCross size={22} />}
      title="Submit Firman" desc={submitted ? 'Ayat tersimpan untuk hari ini.' : 'Pilih satu ayat dari bacaan di bawah.'}
      ctaLabel="Pilih Ayat" done={submitted}
      onAction={() => {/* scroll to reading */document.getElementById('reading-anchor')?.scrollIntoView({ block: 'start' });}} />
    
      <QuestCard
      icon={<GBook size={22} />}
      title="Renungan Pagi" desc={taskState.devotion ? 'Sudah dibaca, indah ya hari ini.' : 'Refleksi singkat berdasarkan bacaan.'}
      ctaLabel="Buka Renungan" done={taskState.devotion}
      onAction={() => onNavigate('devotional')} />
    
      <QuestCard
      icon={<GCheckCircle size={22} />}
      title="Apakah saya sudah melakukan Firman hari ini?" desc={taskState.firman ? 'Checklist sudah diisi, terima kasih.' : 'Gunakan checklist.'}
      ctaLabel="Buka Checklist" done={taskState.firman}
      onAction={() => setTaskState((s) => ({ ...s, firman: true }))} />
    
      <QuestCard
      icon={<GHeart size={20} />}
      title="3 Hal Bersyukur" desc={taskState.gratitude ? 'Disimpan dengan baik.' : 'Apa yang kamu syukuri hari ini?'}
      ctaLabel="Tulis Syukur" done={taskState.gratitude}
      onAction={() => setTaskState((s) => ({ ...s, gratitude: true }))} />
    
    </div>;


  const readingBlock =
  <div id="reading-anchor">
      <ReadingCard onSubmitVerse={onSubmitVerse} submittedToday={submitted} />
    </div>;


  return (
    <>
      <Header
        title={<>Verse<span style={{ color: 'var(--color-primary)' }}>Quest</span></>}
        subtitle="Selasa · 5 Mei 2026"
        trailing={<IdChip onSignOut={() => onNavigate('signin')} />} />
      
      <div className="vq-scroll" style={{ paddingBottom: 90, paddingTop: 16, position: 'relative' }}>
        <div className="vq-grain" />

        {/* Greeting */}
        <div style={{ padding: '0 var(--space-page-x) 14px', position: 'relative' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', letterSpacing: -0.01, lineHeight: 1.25 }}>
            Selamat pagi, {ME.name}.
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {submitted ? 'Hari yang baik untuk merenung lebih dalam.' : 'Mulai harimu dengan satu ayat.'}
          </div>
        </div>

        <StreakHero streak={taskState.verse ? 13 : 12} variant={tweaks.streakStyle} submitted={submitted} />

        {order === 'quests_first' ? <>{questsBlock}{readingBlock}</> : <>{readingBlock}{questsBlock}</>}
      </div>
    </>);

}

// ─── PRAYER WALL ─────────────────────────────────────────────────────────
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
  const [showName, setShowName] = us(true);
  const [submitting, setSubmitting] = us(false);
  const max = 500;
  const tooLong = text.length > max;
  const nearLimit = text.length >= 450;

  function submit() {
    if (!text.trim() || tooLong) return;
    setSubmitting(true);
    setTimeout(() => onSubmit(text.trim()), 500);
  }

  return (
    <>
      <div className="vq-modal-backdrop" onClick={onClose} />
      <div className="vq-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="vq-sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>Tulis Permintaan Doa</div>
          <button onClick={onClose} className="vq-tap" aria-label="Tutup" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 22, padding: 4 }}>×</button>
        </div>

        <textarea
          className="vq-textarea"
          placeholder="Ceritakan permintaan doamu, sesingkat atau sepanjang yang kamu butuhkan..."
          value={text} onChange={(e) => setText(e.target.value)}
          maxLength={max + 50}
          autoFocus />
        

        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Komunitasmu akan saling mendoakan.</span>
          <span className="vq-mono" style={{ color: nearLimit ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
            {text.length} / {max}
          </span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 12, background: 'var(--color-bg-muted)', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Tampilkan namaku</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
              {showName ? `Akan muncul sebagai "${ME.name}"` : 'Akan muncul sebagai "Anonim"'}
            </div>
          </div>
          <button onClick={() => setShowName(!showName)} className="vq-tap" aria-pressed={showName} style={{
            position: 'relative', width: 46, height: 26, borderRadius: 999,
            background: showName ? 'var(--color-primary)' : 'var(--color-border)',
            border: 'none', cursor: 'pointer', transition: 'background 0.15s ease'
          }}>
            <i style={{
              position: 'absolute', top: 3, left: showName ? 23 : 3,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.15s ease', display: 'block'
            }} />
          </button>
        </div>

        <button className="vq-cta vq-tap" disabled={!text.trim() || tooLong || submitting}
        onClick={submit} style={{ marginTop: 16 }}>
          {submitting ? 'Mengirim...' : 'Kirim Doa'}
        </button>
      </div>
    </>);

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

// ─── DEVOTIONAL READER ───────────────────────────────────────────────────
function DevotionalScreen({ onNavigate, taskState, setTaskState }) {
  return (
    <>
      <Header
        title="Renungan Pagi"
        subtitle="Selasa, 5 Mei 2026"
        showBack onBack={() => onNavigate('home')} />
      
      <div className="vq-scroll" style={{ paddingBottom: 110, paddingTop: 8, position: 'relative' }}>
        <div className="vq-grain" />
        <article style={{ padding: '14px var(--space-page-x) 0' }}>
          <div className="vq-badge soft" style={{ marginBottom: 12 }}>{SCHEDULE.book} 23:1</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
            color: 'var(--color-text-primary)', lineHeight: 1.2, letterSpacing: -0.01, margin: 0,
            textWrap: 'balance'
          }}>
            Tuhan, gembala yang tidak pernah lengah.
          </h2>

          <blockquote style={{
            margin: '20px 0 0', padding: '14px 18px',
            borderLeft: '3px solid var(--color-primary)',
            background: 'var(--color-primary-soft)',
            borderRadius: '0 12px 12px 0'
          }}>
            <div className="vq-quote" style={{ fontStyle: 'italic' }}>
              “TUHAN adalah gembalaku, takkan kekurangan aku.”
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-primary)', fontWeight: 700 }}>Mazmur 23:1</div>
          </blockquote>

          <div style={{ marginTop: 18, fontSize: 15.5, lineHeight: 1.7, color: 'var(--color-text-body)' }}>
            <p style={{ margin: '0 0 14px' }}>
              Daud menulis mazmur ini bukan dari kursi nyaman, tapi dari ladang yang panas dan malam yang dingin. Ia tahu betul bagaimana seekor domba bergantung penuh pada gembalanya.
            </p>
            <p style={{ margin: '0 0 14px' }}>
              Hari ini, di tengah hal-hal yang kamu hadapi — tugas yang menumpuk, hubungan yang rumit, masa depan yang belum jelas — kalimat sederhana ini bisa jadi pegangan: <em>aku tidak akan kekurangan</em>.
            </p>
            <p style={{ margin: 0 }}>
              Bukan karena semuanya akan mudah, tapi karena Yang menggembalakanmu tidak pernah lengah.
            </p>
          </div>

          <div style={{
            marginTop: 22, padding: 16, borderRadius: 14,
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Refleksi</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-body)', lineHeight: 1.6 }}>
              Apa satu hal kecil hari ini yang bisa kamu percayakan kepada Tuhan, sebagai latihan untuk percaya pada hal yang lebih besar?
            </div>
          </div>
        </article>
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '12px var(--space-page-x) 16px',
        background: 'color-mix(in oklab, var(--color-bg-card) 92%, transparent)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid var(--color-border)',
        zIndex: 30
      }}>
        <button className="vq-cta vq-tap" disabled={taskState.devotion}
        onClick={() => {setTaskState((s) => ({ ...s, devotion: true }));setTimeout(() => onNavigate('home'), 600);}}
        style={{ background: taskState.devotion ? 'var(--color-success)' : 'var(--color-primary)' }}>
          {taskState.devotion ? <><GCheck color="#fff" stroke={2.5} /> Sudah dibaca</> : 'Tandai sudah dibaca'}
        </button>
      </div>
    </>);

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

// ─── BOTTOM NAV ──────────────────────────────────────────────────────────
function BottomNav({ active, onNavigate, isCoordinator, style = 'emoji' }) {
  const items = [
  { id: 'home', label: 'Beranda', Glyph: GHome },
  { id: 'community', label: 'Komunitas', Glyph: GUsers },
  { id: 'prayer', label: 'Doa', Glyph: GPray }];

  if (isCoordinator) items.push({ id: 'coordinator', label: 'Absensi', Glyph: GCheckCircle });

  return (
    <nav className="vq-bottomnav">
      {items.map(({ id, label, Glyph }) => {
        const isActive = active === id || id === 'prayer' && active === 'prayer';
        return (
          <button key={id} className={`vq-navitem vq-tap ${isActive ? 'active' : ''}`} onClick={() => onNavigate(id)}>
            <Glyph size={style === 'minimal' ? 20 : 22} color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'} filled={isActive} />
            {label}
          </button>);

      })}
    </nav>);

}

Object.assign(window, { HomeScreen, PrayerWall, CreatePrayerModal, CoordinatorScreen, DevotionalScreen, CommunityScreen, SignInScreen, BottomNav });