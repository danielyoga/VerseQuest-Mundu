"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";
import { isAnyAdmin } from "@/lib/constants";
import { APP_DATA_STORAGE_KEY } from "@/hooks/useVerseQuest";

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const m = messages[locale];
  const [communityCount, setCommunityCount] = useState<number | null>(null);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);
  const [isCoordinatorUser, setIsCoordinatorUser] = useState(false);

  // Read phone + coordinator flag from stored profile
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
    // Re-read whenever another tab or the login flow writes to the key
    function onStorage(e: StorageEvent) {
      if (e.key === APP_DATA_STORAGE_KEY) readAdminPhone();
    }
    window.addEventListener("storage", onStorage);
    // Also re-read on custom event fired after login in same tab
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

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  useEffect(() => {
    function onRefresh() {
      loadCount();
    }
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
      ? communityCount > 99
        ? "99+"
        : String(communityCount)
      : null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--vq-border)] bg-[var(--vq-bg)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      aria-label={m.navBarAria}
    >

      {/* Main nav row */}
      <div className="mx-auto flex max-w-[390px]">
        <Link
          href="/"
          className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
            isHome ? "text-[#534AB7]" : "text-[var(--vq-muted)]"
          }`}
          aria-current={isHome ? "page" : undefined}
          aria-label={m.navHomeAria}
        >
          <span className="text-xl leading-none" aria-hidden>🏠</span>
          {m.navHome}
        </Link>

        <Link
          href="/community"
          className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
            isCommunity ? "text-[#534AB7]" : "text-[var(--vq-muted)]"
          }`}
          aria-current={isCommunity ? "page" : undefined}
          aria-label={badge ? `${m.navCommunityAria} (${badge} ${m.navCommunityBadgeHint})` : m.navCommunityAria}
        >
          <span className="relative text-xl leading-none" aria-hidden>
            👥
            {badge ? (
              <span className="absolute -right-1.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#534AB7] px-[5px] text-[10px] font-semibold leading-none text-white">
                {badge}
              </span>
            ) : null}
          </span>
          {m.navCommunity}
        </Link>

        <Link
          href="/prayer-wall"
          className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
            isPrayer ? "text-[#534AB7]" : "text-[var(--vq-muted)]"
          }`}
          aria-current={isPrayer ? "page" : undefined}
          aria-label={m.navPrayerAria}
        >
          <span className="text-xl leading-none" aria-hidden>🙏</span>
          {m.navPrayer}
        </Link>

        {showAdmin && (
          <Link
            href="/admin/devotion"
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              isAdmin ? "text-[#534AB7]" : "text-[var(--vq-muted)]"
            }`}
            aria-current={isAdmin ? "page" : undefined}
            aria-label="Admin"
          >
            <span className="text-xl leading-none" aria-hidden>⚙️</span>
            Admin
          </Link>
        )}

        {isCoordinatorUser && (
          <Link
            href="/coordinator"
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              isCoordinator ? "text-[#534AB7]" : "text-[var(--vq-muted)]"
            }`}
            aria-current={isCoordinator ? "page" : undefined}
            aria-label="Absensi"
          >
            <span className="text-xl leading-none" aria-hidden>✅</span>
            Absensi
          </Link>
        )}
      </div>
    </nav>
  );
}
