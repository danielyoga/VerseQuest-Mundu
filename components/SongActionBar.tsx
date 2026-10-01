"use client";

import type { ReactNode, Ref } from "react";
import { SongToggleButton } from "@/components/SongToggleButton";

type Props = {
  songPlaying: boolean;
  onToggleSong: () => void;
  actionLabel: ReactNode;
  onAction: () => void;
  actionDisabled?: boolean;
  actionRef?: Ref<HTMLButtonElement>;
  /**
   * The page's side gutter and background as literal Tailwind classes, so the bar blends in,
   * e.g. "-mx-7 px-7 bg-[var(--vq-bg-2)] before:from-[var(--vq-bg-2)]".
   */
  surfaceClassName: string;
};

/**
 * Bar pinned to the bottom of the screen: ♪ song toggle + the page's main action. When the
 * content is taller than the screen it scrolls under a short fade and the bar stays reachable.
 */
export function SongActionBar({
  songPlaying,
  onToggleSong,
  actionLabel,
  onAction,
  actionDisabled,
  actionRef,
  surfaceClassName,
}: Props) {
  return (
    <div
      className={`sticky bottom-0 flex gap-3 pb-[max(24px,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-linear-to-t before:to-transparent ${surfaceClassName}`}
    >
      <SongToggleButton playing={songPlaying} onToggle={onToggleSong} className="h-14 w-14 rounded-2xl" />
      <button
        ref={actionRef}
        type="button"
        onClick={onAction}
        disabled={actionDisabled}
        className="min-h-[56px] min-w-0 flex-1 rounded-2xl bg-[var(--vq-brand)] text-[18px] font-medium text-white transition-colors hover:bg-[var(--vq-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vq-brand)] active:scale-[0.98] disabled:opacity-60"
      >
        {actionLabel}
      </button>
    </div>
  );
}
