"use client";

import { useCallback, useRef } from "react";
import { useFitFontSize } from "@/hooks/useFitFontSize";

/** Reference phone for the preview (CSS px); the frame is drawn at PREVIEW_SCALE. */
const PHONE_W = 390;
const PHONE_H = 844;
const PREVIEW_SCALE = 0.6;

type Props = {
  text: string;
  placeholder: string;
  eyebrow: string;
  hint: string;
  amenLabel: string;
};

/**
 * The /doa prayer page on a 390×844 phone, scaled down, with the same font fitting —
 * so admins see the size members will get. Layout mirrors app/doa/page.tsx; keep them in sync.
 */
export function PrayerPhonePreview({ text, placeholder, eyebrow, hint, amenLabel }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const bodyFits = useCallback(() => {
    const body = bodyRef.current;
    return !body || body.scrollHeight <= body.clientHeight;
  }, []);
  useFitFontSize(textRef, bodyFits, text);

  return (
    <div
      aria-hidden
      className="mx-auto overflow-hidden rounded-[20px] border border-[var(--vq-border)] shadow-sm"
      style={{ width: PHONE_W * PREVIEW_SCALE, height: PHONE_H * PREVIEW_SCALE }}
    >
      <div
        className="flex origin-top-left flex-col gap-[14px] overflow-hidden bg-[var(--vq-bg-2)] px-7 py-6"
        style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${PREVIEW_SCALE})` }}
      >
        <div className="flex h-11 shrink-0 items-center">
          <span className="text-[12px] font-medium uppercase leading-4 tracking-[0.025em] text-[var(--vq-muted)]">
            {eyebrow}
          </span>
        </div>
        {/* Like /doa: past the smallest size the text scrolls and Amen stays on screen. */}
        <div
          ref={bodyRef}
          className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto text-center [justify-content:safe_center]"
        >
          <div className="h-[2px] w-10 shrink-0 rounded-sm bg-[var(--vq-brand)]" />
          <p
            ref={textRef}
            className={`m-0 whitespace-pre-line text-[24px] font-normal leading-[1.6] [overflow-wrap:anywhere] [text-wrap:pretty] ${
              text ? "text-[var(--vq-text)]" : "text-[var(--vq-muted-2)]"
            }`}
          >
            {text || placeholder}
          </p>
          <div className="h-[2px] w-10 shrink-0 rounded-sm bg-[var(--vq-brand)]" />
          <p className="m-0 text-[14px] leading-[1.625] text-[var(--vq-muted)]">{hint}</p>
        </div>
        <div className="flex shrink-0 gap-3">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-[var(--vq-brand-tint)]" />
          <div className="flex min-h-[56px] flex-1 items-center justify-center rounded-2xl bg-[var(--vq-brand)] text-[18px] font-medium text-white">
            {amenLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
