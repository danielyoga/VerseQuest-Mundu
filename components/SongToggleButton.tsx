"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";

type Props = {
  playing: boolean;
  onToggle: () => void;
  /** Size and shape, e.g. "h-14 w-14 rounded-2xl". */
  className?: string;
};

/** ♪ to start the page's song, ❚❚ to pause it. */
export function SongToggleButton({ playing, onToggle, className = "" }: Props) {
  const { locale } = useLocale();
  const m = messages[locale];
  const label = playing ? m.songPause : m.songPlay;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center justify-center bg-[var(--vq-brand-tint)] text-[var(--vq-brand)] transition-colors hover:bg-[#dedcfb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vq-brand)] active:scale-[0.98] ${className}`}
    >
      {playing ? (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
          <rect x="5.5" y="4.5" width="3.5" height="13" rx="1.2" />
          <rect x="13" y="4.5" width="3.5" height="13" rx="1.2" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path d="M9 16.5V5.2l8.5-1.7v11.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6.8" cy="16.5" r="2.4" fill="currentColor" />
          <circle cx="15.3" cy="14.8" r="2.4" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
