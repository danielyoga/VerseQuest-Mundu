"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const m = messages[locale];
  const [communityCount, setCommunityCount] = useState<number | null>(null);

  /** No fixed interval: event after submit, tab visible again, and route changes keep the badge fresh without polling. */
  const loadCount = useCallback(() => {
    /** Same payload as the community page (verses + count) — one Sheets read instead of a separate count route. */
    void fetch("/api/verse-community", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { count?: number }) =>
        setCommunityCount(typeof d.count === "number" ? d.count : 0)
      )
      .catch(() => setCommunityCount(0));
  }, []);

  useEffect(() => {
    loadCount();
  }, [loadCount, pathname]);

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
      <div className="mx-auto flex max-w-[390px]">
        <Link
          href="/"
          className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
            isHome ? "text-[#534AB7]" : "text-[var(--vq-muted)]"
          }`}
          aria-current={isHome ? "page" : undefined}
          aria-label={m.navHomeAria}
        >
          <span className="text-xl leading-none" aria-hidden>
            🏠
          </span>
          {m.navHome}
        </Link>
        <Link
          href="/community"
          className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
            isCommunity ? "text-[#534AB7]" : "text-[var(--vq-muted)]"
          }`}
          aria-current={isCommunity ? "page" : undefined}
          aria-label={
            badge ? `${m.navCommunityAria} (${badge} ${m.navCommunityBadgeHint})` : m.navCommunityAria
          }
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
      </div>
    </nav>
  );
}
