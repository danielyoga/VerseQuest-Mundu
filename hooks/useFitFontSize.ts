"use client";

import { useLayoutEffect, type RefObject } from "react";

/** Prayer text: 24px is the design size and never grows; long text shrinks toward 16px. */
export const PRAYER_FONT_MAX = 24;
export const PRAYER_FONT_MIN = 16;

/**
 * Sets `textRef`'s font size to the largest whole px in [min, max] for which `fits()` holds
 * (min when nothing fits). Re-fits when `text` changes, when web fonts finish loading, and on
 * width changes — not height changes, so mobile toolbars showing/hiding can't make it flicker.
 * `fits` should be stable (useCallback).
 */
export function useFitFontSize(
  textRef: RefObject<HTMLElement | null>,
  fits: () => boolean,
  text: string,
  max = PRAYER_FONT_MAX,
  min = PRAYER_FONT_MIN
) {
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      while (size > min && !fits()) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      fit();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [textRef, fits, text, max, min]);
}
