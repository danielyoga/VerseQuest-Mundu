"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { buildPersonalReminderLink } from "@/lib/whatsapp";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import {
  GBack, GCheck, GChevronR, GWhatsApp, GFlame, GSparkle, GClock,
} from "@/components/ui/Glyphs";
import type { StoredProfile } from "@/types";

// ── Shared constant (also read by BottomNav) ─────────────────────────────────
export const COORDINATOR_PENDING_KEY = "vq_coordinator_pending";

// ── Types ────────────────────────────────────────────────────────────────────

interface MemberStatus {
  phone: string;
  name: string;
  submitted_today: boolean;
}

type History = Record<string, Record<string, boolean>>; // phone → date → submitted
type Notes   = Record<string, string>;                  // phone → note text

// ── localStorage helpers ─────────────────────────────────────────────────────

const HISTORY_KEY = "vq_member_history";
const NOTES_KEY   = "vq_coordinator_notes";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

function loadHistory(): History {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "{}") as History; }
  catch { return {}; }
}

function saveHistory(hist: History) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(hist)); } catch {}
}

function persistTodayHistory(members: MemberStatus[]) {
  const today = todayStr();
  const hist = loadHistory();
  for (const m of members) {
    if (!hist[m.phone]) hist[m.phone] = {};
    hist[m.phone]![today] = m.submitted_today;
  }
  saveHistory(hist);
}

function memberDots(phone: string, hist: History): (boolean | null)[] {
  const days = last7Days();
  const rec = hist[phone] ?? {};
  return days.map(d => (d in rec ? rec[d]! : null));
}

function loadNotes(): Notes {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}") as Notes; }
  catch { return {}; }
}

function saveNote(phone: string, note: string) {
  const notes = loadNotes();
  if (note.trim()) { notes[phone] = note.trim(); } else { delete notes[phone]; }
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch {}
}

// ── Build WA group reminder text ─────────────────────────────────────────────

function groupReminderText(rantingName: string, pendingNames: string[], appUrl: string): string {
  const firstNames = pendingNames.map(n => n.split(" ")[0]).slice(0, 5);
  const extra = pendingNames.length > 5 ? ` (+${pendingNames.length - 5} lagi)` : "";
  return [
    `Halo teman-teman ranting ${rantingName}! 🙏`,
    "",
    "Mengingatkan untuk submit firman hari ini.",
    `Yang belum: ${firstNames.join(", ")}${extra}`,
    "",
    `Link: ${appUrl}`,
    "",
    "Tuhan memberkati!",
  ].join("\n");
}

// ── HeatmapDots ──────────────────────────────────────────────────────────────

function HeatmapDots({ dots }: { dots: (boolean | null)[] }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {dots.map((d, i) => {
        // Count consecutive falses ending at i
        let consec = 0;
        if (d === false) {
          for (let j = i; j >= 0 && dots[j] === false; j--) consec++;
        }
        const danger = consec >= 3;
        return (
          <div
            key={i}
            title={d === null ? "Tidak ada data" : d ? "Sudah submit" : "Belum submit"}
            style={{
              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              background:
                d === true  ? (danger ? "var(--color-danger)" : "var(--color-primary)") :
                d === false ? "transparent" :
                              "var(--color-border)",
              border:
                d === true  ? "none" :
                d === false ? `1.5px solid ${danger ? "var(--color-danger)" : "var(--color-border)"}` :
                              "1.5px solid var(--color-border-muted)",
            }}
          />
        );
      })}
    </div>
  );
}

// ── MemberCard ───────────────────────────────────────────────────────────────

function avatarInitials(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0]![0]! + p[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function MemberCard({
  member, dots, note, isDone, onLongPress,
}: {
  member: MemberStatus;
  dots: (boolean | null)[];
  note: string;
  isDone?: boolean;
  onLongPress: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startPress() {
    timerRef.current = setTimeout(() => onLongPress(), 600);
  }
  function cancelPress() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  return (
    <div
      className="vq-card"
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
        userSelect: "none",
        borderColor: isDone ? "var(--color-success-border)" : undefined,
        background: isDone ? "var(--color-success-bg)" : undefined,
      }}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
    >
      <div className="vq-avatar">{avatarInitials(member.name)}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
          {member.name}
        </div>
        <HeatmapDots dots={dots} />
        {note && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
            <GClock size={11} color="var(--color-text-muted)" />
            <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontStyle: "italic" }}>{note}</span>
          </div>
        )}
      </div>

      {isDone ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-success-text)", fontSize: 11, fontWeight: 600 }}>
          <GCheck size={14} stroke={2.5} color="var(--color-success-text)" />
          <span style={{ fontStyle: "italic", color: "var(--color-text-muted)" }}>(ayat tersimpan)</span>
        </div>
      ) : (
        <a
          href={buildPersonalReminderLink(member.phone, member.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="vq-tap"
          aria-label={`WhatsApp ${member.name}`}
          onClick={e => e.stopPropagation()}
          style={{
            width: 40, height: 40, borderRadius: "50%", background: "#25D366",
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none", flexShrink: 0,
          }}
        >
          <GWhatsApp size={18} color="#fff" />
        </a>
      )}
    </div>
  );
}

// ── MemberNoteSheet ──────────────────────────────────────────────────────────

function MemberNoteSheet({ name, phone, initial, onClose }: {
  name: string; phone: string; initial: string;
  onClose: (note: string) => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(20,12,50,0.45)", zIndex: 100 }}
        onClick={() => onClose(text)}
      />
      <div
        className="animate-vq-slide-up"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--color-bg-card)", borderRadius: "20px 20px 0 0",
          padding: "12px 20px 32px", boxShadow: "var(--shadow-modal)", zIndex: 101,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "0 auto 14px" }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-display)", marginBottom: 12 }}>
          Catatan · {name}
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0, 100))}
          placeholder="Catatan singkat… (maks. 100 karakter)"
          maxLength={100}
          autoFocus
          style={{
            width: "100%", minHeight: 80, border: "1.5px solid var(--color-border)",
            borderRadius: "var(--radius-md)", padding: "10px 12px",
            background: "#FAFAFF", fontFamily: "var(--font-body)",
            fontSize: 14, color: "var(--color-text-primary)",
            outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.5,
          }}
        />
        <div style={{ marginTop: 4, fontSize: 11, textAlign: "right", color: "var(--color-text-muted)" }}>
          {text.length}/100
        </div>
        <button
          onClick={() => onClose(text)}
          style={{
            marginTop: 12, width: "100%", padding: 14,
            borderRadius: "var(--radius-md)", background: "var(--color-primary)",
            color: "#fff", fontSize: 15, fontWeight: 700,
            border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
          }}
        >
          Simpan Catatan
        </button>
        {initial && (
          <button
            onClick={() => onClose("")}
            style={{
              marginTop: 8, width: "100%", padding: "10px 0",
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--color-danger-text)", fontFamily: "var(--font-body)",
            }}
          >
            Hapus catatan
          </button>
        )}
      </div>
    </>
  );
}

// ── GroupReminderSheet ───────────────────────────────────────────────────────

function GroupReminderSheet({ rantingName, pendingNames, onClose }: {
  rantingName: string; pendingNames: string[]; onClose: () => void;
}) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const [text, setText] = useState(() => groupReminderText(rantingName, pendingNames, appUrl));
  const waUrl = `https://api.whatsapp.com/send/?text=${encodeURIComponent(text).replace(/%20/g, "+")}`;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(20,12,50,0.45)", zIndex: 100 }} onClick={onClose} />
      <div
        className="animate-vq-slide-up"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--color-bg-card)", borderRadius: "20px 20px 0 0",
          padding: "12px 20px 32px", boxShadow: "var(--shadow-modal)",
          zIndex: 101, maxHeight: "80dvh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
            Kirim Pengingat
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "var(--color-text-muted)", padding: 4, lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 10px" }}>
          Edit pesan di bawah sebelum dikirim.
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          style={{
            width: "100%", minHeight: 180, border: "1.5px solid var(--color-border)",
            borderRadius: "var(--radius-md)", padding: "10px 12px",
            background: "#FAFAFF", fontFamily: "var(--font-body)",
            fontSize: 14, color: "var(--color-text-primary)",
            outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6,
          }}
        />
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginTop: 12, padding: 14, borderRadius: "var(--radius-md)",
            background: "#25D366", color: "#fff", fontSize: 15, fontWeight: 700,
            textDecoration: "none", fontFamily: "var(--font-body)",
          }}
        >
          <GWhatsApp size={18} color="#fff" /> Kirim ke Grup WA
        </a>
      </div>
    </>
  );
}

// ── WeeklySummarySheet ───────────────────────────────────────────────────────

function WeeklySummarySheet({ rantingName, members, history, onClose }: {
  rantingName: string; members: MemberStatus[]; history: History; onClose: () => void;
}) {
  const days  = last7Days();
  const today = todayStr();
  const total = members.length;

  const submittedToday = members.filter(m => m.submitted_today).length;
  const todayRate = total ? Math.round((submittedToday / total) * 100) : 0;

  // Per-member 7-day count
  const memberCounts = members
    .map(m => ({ name: m.name, count: days.filter(d => (history[m.phone] ?? {})[d] === true).length }))
    .sort((a, b) => b.count - a.count);
  const topMember    = memberCounts[0];
  const bottomMember = memberCounts.at(-1);

  const dateRange = [
    new Date(days[0]! + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    new Date(today + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
  ].join(" – ");

  const summaryText = [
    `Ringkasan Minggu · Ranting ${rantingName}`,
    dateRange,
    "",
    `Kehadiran hari ini: ${submittedToday}/${total} (${todayRate}%)`,
    topMember?.count ? `Paling konsisten: ${topMember.name} (${topMember.count}/7)` : "",
    (bottomMember && bottomMember.count <= 3 && bottomMember.name !== topMember?.name)
      ? `Perlu perhatian: ${bottomMember.name} (${bottomMember.count}/7)` : "",
  ].filter(Boolean).join("\n");

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ text: summaryText }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(summaryText); } catch {}
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(20,12,50,0.45)", zIndex: 100 }} onClick={onClose} />
      <div
        className="animate-vq-slide-up"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--color-bg-card)", borderRadius: "20px 20px 0 0",
          padding: "12px 20px 32px", boxShadow: "var(--shadow-modal)",
          zIndex: 101, maxHeight: "80dvh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
            Ringkasan Minggu
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "var(--color-text-muted)", padding: 4, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 18 }}>
          Ranting {rantingName} · {dateRange}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <StatRow label="Kehadiran hari ini" value={`${submittedToday}/${total} (${todayRate}%)`} />
          {topMember && topMember.count > 0 && (
            <StatRow label="Paling konsisten" value={`${topMember.name} (${topMember.count}/7)`} valueColor="var(--color-success-text)" />
          )}
          {bottomMember && bottomMember.count <= 3 && bottomMember.name !== topMember?.name && (
            <StatRow label="Perlu perhatian" value={`${bottomMember.name} (${bottomMember.count}/7)`} valueColor="var(--color-danger-text)" />
          )}
        </div>

        <button
          onClick={() => { void handleShare(); }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: 14, borderRadius: "var(--radius-md)",
            background: "var(--color-primary)", color: "#fff",
            fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          <GSparkle size={16} color="#fff" /> Bagikan sebagai Teks
        </button>
      </div>
    </>
  );
}

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 14px", background: "var(--color-bg-muted)", borderRadius: 12,
    }}>
      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: valueColor ?? "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
        {value}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CoordinatorPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const m = messages[locale];

  const [profile, setProfile]             = useState<StoredProfile | null>(null);
  const [authChecked, setAuthChecked]     = useState(false);
  const [members, setMembers]             = useState<MemberStatus[]>([]);
  const [ranting, setRanting]             = useState("");
  const [loading, setLoading]             = useState(true);
  const [doneOpen, setDoneOpen]           = useState(false);
  const [filter, setFilter]               = useState<"not" | "done" | null>(null);
  const [groupOpen, setGroupOpen]         = useState(false);
  const [weeklyOpen, setWeeklyOpen]       = useState(false);
  const [notes, setNotes]                 = useState<Notes>({});
  const [noteFor, setNoteFor]             = useState<{ phone: string; name: string } | null>(null);
  const [history, setHistory]             = useState<History>({});

  // Auth check
  useEffect(() => {
    try {
      const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
      const p = (JSON.parse(raw ?? "{}") as { profile?: StoredProfile }).profile ?? null;
      if (!p?.is_coordinator) { router.replace("/"); return; }
      setProfile(p);
    } catch { router.replace("/"); }
    finally { setAuthChecked(true); }
  }, [router]);

  // Fetch members
  useEffect(() => {
    if (!authChecked || !profile?.is_coordinator) return;
    const phone      = encodeURIComponent(profile.phone);
    const rantingArg = encodeURIComponent(profile.coordinator_ranting ?? "");
    void fetch(`/api/coordinator/members?phone=${phone}&ranting=${rantingArg}`)
      .then(r => r.json())
      .then((d: { ranting?: string; members?: MemberStatus[] }) => {
        const fetched = d.members ?? [];
        setRanting(d.ranting ?? "");
        setMembers(fetched);
        persistTodayHistory(fetched);
        const hist = loadHistory();
        setHistory(hist);
        setNotes(loadNotes());
        // Expose pending count for BottomNav badge
        try { localStorage.setItem(COORDINATOR_PENDING_KEY, String(fetched.filter(x => !x.submitted_today).length)); } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authChecked, profile]);

  const notSubmitted = members.filter(m => !m.submitted_today);
  const submitted    = members.filter(m => m.submitted_today);

  // Avg 7-day streak label
  const avgStreakLabel = (() => {
    if (members.length === 0) return "--";
    const days  = last7Days();
    const rates = members.map(m => days.filter(d => (history[m.phone] ?? {})[d] === true).length);
    if (rates.every(r => r === 0)) return "--";
    return `${Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)} hr`;
  })();

  if (!authChecked) return null;

  // Which list to show depends on the active filter
  const activeList = filter === "done" ? submitted : notSubmitted;

  return (
    <div style={{ minHeight: "min(100dvh, 880px)", background: "var(--color-bg-page)", position: "relative" }}>
      <div className="vq-grain" />

      {/* ── Header ── */}
      <div className="vq-header">
        <div className="vq-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => router.back()}
              className="vq-tap"
              aria-label={m.coordinatorBackAria}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: 4, marginLeft: -4,
                display: "flex", alignItems: "center", color: "var(--color-text-secondary)",
              }}
            >
              <GBack size={22} />
            </button>
            <div>
              <div className="vq-title">{m.coordinatorTitle}</div>
              {ranting && <div className="vq-subtitle">{ranting}</div>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px var(--space-page-x) 100px", position: "relative" }}>
        {loading ? (
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", textAlign: "center", paddingTop: 32 }}>
            {m.coordinatorLoading}
          </p>
        ) : (
          <>
            {/* ── 5.2 — Stat boxes ── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {/* Belum Submit */}
              <button
                type="button"
                onClick={() => setFilter(f => f === "not" ? null : "not")}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, cursor: "pointer",
                  background: "var(--color-danger-bg)", textAlign: "left",
                  border: "1px solid var(--color-danger-border)",
                  borderBottom: filter === "not" ? "3px solid var(--color-primary)" : "1px solid var(--color-danger-border)",
                  transition: "border-bottom 0.12s",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-danger-text)", textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.85 }}>
                  Belum Submit
                </div>
                <div className="vq-mono" style={{ fontSize: 28, fontWeight: 700, color: "var(--color-danger-text)", marginTop: 2 }}>
                  {notSubmitted.length}
                </div>
              </button>

              {/* Sudah Submit */}
              <button
                type="button"
                onClick={() => setFilter(f => f === "done" ? null : "done")}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, cursor: "pointer",
                  background: "var(--color-success-bg)", textAlign: "left",
                  border: "1px solid var(--color-success-border)",
                  borderBottom: filter === "done" ? "3px solid var(--color-primary)" : "1px solid var(--color-success-border)",
                  transition: "border-bottom 0.12s",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-success-text)", textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.85 }}>
                  Sudah Submit
                </div>
                <div className="vq-mono" style={{ fontSize: 28, fontWeight: 700, color: "var(--color-success-text)", marginTop: 2 }}>
                  {submitted.length}
                </div>
              </button>

              {/* Streak rata-rata */}
              <div style={{
                flex: 1, padding: 12, borderRadius: 12,
                background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  <GFlame size={11} color="var(--color-text-muted)" /> Streak
                </div>
                <div className="vq-mono" style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 2 }}>
                  {avgStreakLabel}
                </div>
              </div>
            </div>

            {/* ── 5.3 — Action bar ── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => setGroupOpen(true)}
                className="vq-tap"
                disabled={notSubmitted.length === 0}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 12px", borderRadius: "var(--radius-md)",
                  background: notSubmitted.length > 0 ? "var(--color-primary)" : "var(--color-bg-muted)",
                  color: notSubmitted.length > 0 ? "#fff" : "var(--color-text-muted)",
                  border: "none", cursor: notSubmitted.length > 0 ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)",
                }}
              >
                🔔 Kirim Pengingat
              </button>
              <button
                type="button"
                onClick={() => setWeeklyOpen(true)}
                className="vq-tap"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 12px", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-card)", color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)",
                }}
              >
                📊 Ringkasan Minggu
              </button>
            </div>

            {/* ── 5.4 — Member list (filtered or default) ── */}
            {filter !== null ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 }}>
                  {filter === "not" ? "Belum Submit" : "Sudah Submit"} ({activeList.length})
                </div>
                {activeList.length === 0 ? (
                  <p style={{ fontSize: 14, color: "var(--color-text-muted)", textAlign: "center", padding: "24px 0" }}>
                    Tidak ada anggota.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                    {activeList.map(member => (
                      <MemberCard
                        key={member.phone || member.name}
                        member={member}
                        dots={memberDots(member.phone, history)}
                        note={notes[member.phone] ?? ""}
                        isDone={filter === "done"}
                        onLongPress={() => setNoteFor({ phone: member.phone, name: member.name })}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Default: not-submitted list + collapsible submitted */}
                {notSubmitted.length === 0 ? (
                  <div className="vq-card" style={{
                    background: "var(--color-success-bg)", borderColor: "var(--color-success-border)",
                    textAlign: "center", padding: 24, marginBottom: 18,
                  }}>
                    <div style={{ width: 48, height: 48, margin: "0 auto 10px", borderRadius: "50%", background: "var(--color-success-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <GCheck size={26} stroke={2.5} color="var(--color-success-text)" />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-success-text)", fontFamily: "var(--font-display)" }}>
                      {m.coordinatorAllDone}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 }}>
                      Sapa lewat WhatsApp
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                      {notSubmitted.map(member => (
                        <MemberCard
                          key={member.phone || member.name}
                          member={member}
                          dots={memberDots(member.phone, history)}
                          note={notes[member.phone] ?? ""}
                          onLongPress={() => setNoteFor({ phone: member.phone, name: member.name })}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* ── 5.6 — Collapsible submitted ── */}
                {submitted.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setDoneOpen(v => !v)}
                      className="vq-tap"
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "transparent", border: "none", padding: "10px 4px", cursor: "pointer",
                        fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
                        color: "var(--color-text-muted)", fontFamily: "var(--font-body)",
                      }}
                    >
                      <span>Sudah submit ({submitted.length})</span>
                      <span style={{ transform: doneOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                        <GChevronR size={14} />
                      </span>
                    </button>
                    {doneOpen && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                        {submitted.map(member => (
                          <div key={member.phone || member.name} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", borderRadius: 12,
                            background: "var(--color-bg-muted)", opacity: 0.75,
                          }}>
                            <GCheck size={16} stroke={2.5} color="var(--color-success-text)" />
                            <span style={{ flex: 1, fontSize: 13.5, color: "var(--color-text-secondary)" }}>{member.name}</span>
                            <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontStyle: "italic" }}>(ayat tersimpan)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Sheets ── */}
      {groupOpen && (
        <GroupReminderSheet
          rantingName={ranting}
          pendingNames={notSubmitted.map(m => m.name)}
          onClose={() => setGroupOpen(false)}
        />
      )}
      {weeklyOpen && (
        <WeeklySummarySheet
          rantingName={ranting}
          members={members}
          history={history}
          onClose={() => setWeeklyOpen(false)}
        />
      )}
      {noteFor && (
        <MemberNoteSheet
          name={noteFor.name}
          phone={noteFor.phone}
          initial={notes[noteFor.phone] ?? ""}
          onClose={note => {
            saveNote(noteFor.phone, note);
            setNotes(loadNotes());
            setNoteFor(null);
          }}
        />
      )}
    </div>
  );
}
