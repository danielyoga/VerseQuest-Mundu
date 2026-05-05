"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { isAnyAdmin } from "@/lib/constants";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";
import { GHome, GUsers, GPray, GCheckCircle, GSettings } from "@/components/ui/Glyphs";

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const m = messages[locale];
  const [communityCount, setCommunityCount] = useState<number | null>(null);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);
  const [isCoordinatorUser, setIsCoordinatorUser] = useState(false);

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

  useEffect(() => {
    readAdminPhone();
    function onStorage(e: StorageEvent) {
      if (e.key === APP_DATA_STORAGE_KEY) readAdminPhone();
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
    <nav className="vq-bottomnav" aria-label={m.navBarAria}>
      <div style={{ display: 'flex', flex: 1, maxWidth: 390, margin: '0 auto', width: '100%' }}>
        <Link
          href="/"
          className={`vq-navitem${isHome ? ' active' : ''}`}
          aria-current={isHome ? "page" : undefined}
          aria-label={m.navHomeAria}
        >
          <GHome size={22} color={isHome ? 'var(--color-primary)' : 'var(--color-text-muted)'} filled={isHome} />
          {m.navHome}
        </Link>

        <Link
          href="/community"
          className={`vq-navitem${isCommunity ? ' active' : ''}`}
          aria-current={isCommunity ? "page" : undefined}
          aria-label={badge ? `${m.navCommunityAria} (${badge} ${m.navCommunityBadgeHint})` : m.navCommunityAria}
          style={{ position: 'relative' }}
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
        </Link>

        <Link
          href="/prayer-wall"
          className={`vq-navitem${isPrayer ? ' active' : ''}`}
          aria-current={isPrayer ? "page" : undefined}
          aria-label={m.navPrayerAria}
        >
          <GPray size={22} color={isPrayer ? 'var(--color-primary)' : 'var(--color-text-muted)'} filled={isPrayer} />
          {m.navPrayer}
        </Link>

        {showAdmin && (
          <Link
            href="/admin/devotion"
            className={`vq-navitem${isAdmin ? ' active' : ''}`}
            aria-current={isAdmin ? "page" : undefined}
            aria-label="Admin"
          >
            <GSettings size={20} color={isAdmin ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
            Admin
          </Link>
        )}

        {isCoordinatorUser && (
          <Link
            href="/coordinator"
            className={`vq-navitem${isCoordinator ? ' active' : ''}`}
            aria-current={isCoordinator ? "page" : undefined}
            aria-label="Absensi"
          >
            <GCheckCircle size={22} color={isCoordinator ? 'var(--color-primary)' : 'var(--color-text-muted)'} filled={isCoordinator} />
            Absensi
          </Link>
        )}
      </div>
    </nav>
  );
}
