"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { isAnyAdmin } from "@/lib/constants";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { GHome, GUsers, GPray, GCheckCircle, GSettings } from "@/components/ui/Glyphs";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const m = messages[locale];
  const [communityCount, setCommunityCount] = useState<number | null>(null);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);
  const [isCoordinatorUser, setIsCoordinatorUser] = useState(false);
  const [coordinatorPending, setCoordinatorPending] = useState(0);

  function readAdminPhone() {
    try {
      const raw = localStorage.getItem(APP_DATA_STORAGE_KEY);
      const parsed = raw
        ? (JSON.parse(raw) as { profile?: { phone?: string; is_coordinator?: boolean } })
        : null;
      setAdminPhone(parsed?.profile?.phone ?? null);
      setIsCoordinatorUser(parsed?.profile?.is_coordinator ?? false);
    } catch {
      setAdminPhone(null);
      setIsCoordinatorUser(false);
    }
  }

  function readCoordinatorPending() {
    try {
      const n = parseInt(localStorage.getItem("vq_coordinator_pending") ?? "0", 10);
      setCoordinatorPending(isNaN(n) ? 0 : n);
    } catch { setCoordinatorPending(0); }
  }

  useEffect(() => {
    readAdminPhone();
    readCoordinatorPending();
    function onStorage(e: StorageEvent) {
      if (e.key === APP_DATA_STORAGE_KEY) readAdminPhone();
      if (e.key === "vq_coordinator_pending") readCoordinatorPending();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("versequest-profile-updated", readAdminPhone);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("versequest-profile-updated", readAdminPhone);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAdmin = adminPhone ? isAnyAdmin(adminPhone) : false;

  const loadCount = useCallback(() => {
    void fetch("/api/verse-community-count")
      .then((r) => r.json())
      .then((d: { count?: number }) =>
        setCommunityCount(typeof d.count === "number" ? d.count : 0)
      )
      .catch(() => setCommunityCount(0));
  }, []);

  useEffect(() => { loadCount(); }, [loadCount]);

  useEffect(() => {
    function onRefresh() { loadCount(); }
    window.addEventListener("versequest-community-refresh", onRefresh);
    function onVis() {
      if (document.visibilityState === "visible") loadCount();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("versequest-community-refresh", onRefresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadCount]);

  const isHome = pathname === "/";
  const isCommunity = pathname === "/community";
  const isPrayer = pathname === "/prayer-wall";
  const isAdmin = pathname.startsWith("/admin");
  const isCoordinator = pathname === "/coordinator";
  const badge =
    communityCount != null && communityCount > 0
      ? communityCount > 99 ? "99+" : String(communityCount)
      : null;

  return (
    <nav className="vq-bottomnav">
      <button
        type="button"
        className={`vq-navitem vq-tap${isHome ? ' active' : ''}`}
        onClick={() => router.push("/")}
      >
        <GHome size={22} color={isHome ? 'var(--color-primary)' : 'var(--color-text-muted)'} filled={isHome} />
        {m.navHome}
      </button>

      <button
        type="button"
        className={`vq-navitem vq-tap${isCommunity ? ' active' : ''}`}
        onClick={() => router.push("/community")}
      >
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <GUsers size={22} color={isCommunity ? 'var(--color-primary)' : 'var(--color-text-muted)'} filled={isCommunity} />
          {badge && (
            <span style={{
              position: 'absolute', top: -4, right: -8,
              minWidth: 16, height: 16, borderRadius: 8,
              background: 'var(--color-primary)', color: '#fff',
              fontSize: 9, fontWeight: 700, lineHeight: '16px',
              textAlign: 'center', padding: '0 3px',
            }}>
              {badge}
            </span>
          )}
        </span>
        {m.navCommunity}
      </button>

      <button
        type="button"
        className={`vq-navitem vq-tap${isPrayer ? ' active' : ''}`}
        onClick={() => router.push("/prayer-wall")}
      >
        <GPray size={22} color={isPrayer ? 'var(--color-primary)' : 'var(--color-text-muted)'} filled={isPrayer} />
        {m.navPrayer}
      </button>

      {showAdmin && (
        <button
          type="button"
          className={`vq-navitem vq-tap${isAdmin ? ' active' : ''}`}
          onClick={() => router.push("/admin/devotion")}
        >
          <GSettings size={20} color={isAdmin ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
          Admin
        </button>
      )}

      {isCoordinatorUser && (
        <button
          type="button"
          className={`vq-navitem vq-tap${isCoordinator ? ' active' : ''}`}
          onClick={() => router.push("/coordinator")}
        >
          {coordinatorPending > 0 && <span className="vq-navitem-badge" aria-hidden="true" />}
          <GCheckCircle size={22} color={isCoordinator ? 'var(--color-primary)' : 'var(--color-text-muted)'} filled={isCoordinator} />
          Absensi
        </button>
      )}
    </nav>
  );
}
