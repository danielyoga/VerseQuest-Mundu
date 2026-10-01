"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A looping background song for one page. Tries to start when the page opens (browsers may block
 * sound until a tap — then `toggle` starts it), remembers a pause on this device under `prefKey`,
 * and stops when the page unmounts. Render `<audio ref={audioRef} src=… loop preload="auto" />`
 * once, at a position that never changes between renders.
 */
export function usePageSong(prefKey: string) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    let wantsMusic = true;
    try {
      wantsMusic = localStorage.getItem(prefKey) !== "off";
    } catch {
      /* storage unavailable: default to playing */
    }
    if (wantsMusic) void audio.play().catch(() => {});
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
    };
  }, [prefKey]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const start = audio.paused;
    if (start) void audio.play().catch(() => {});
    else audio.pause();
    try {
      localStorage.setItem(prefKey, start ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, [prefKey]);

  return { audioRef, playing, toggle };
}
