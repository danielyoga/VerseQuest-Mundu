"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";

/** Switches between the admin editors (Renungan / Doa Harian). */
export function AdminTabs() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const m = messages[locale];

  const tabs = [
    { href: "/admin/devotion", label: m.adminTabDevotion },
    { href: "/admin/prayer", label: m.adminTabPrayer },
  ];

  return (
    <nav
      aria-label={m.adminTabsAria}
      className="mb-5 flex w-full max-w-[360px] gap-1 rounded-full border border-[var(--vq-border)] bg-[var(--vq-bg-2)] p-1"
    >
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[40px] flex-1 items-center justify-center rounded-full px-3 text-[13px] font-medium transition-colors ${
              active
                ? "bg-[var(--vq-bg)] text-[#534AB7] shadow-sm"
                : "text-[var(--vq-muted)] hover:text-[var(--vq-text)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
