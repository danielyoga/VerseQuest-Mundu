"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { useLocale } from "@/contexts/LocaleContext";
import { DAYS_PER_FRUIT } from "@/lib/fruitsOfSpirit";
import type { AmenResult } from "@/lib/fruitStreak";
import { messages } from "@/lib/i18n";

type Props = {
  result: AmenResult | null; // null = closed
  playKey: number; // bump on every Amen tap so the reveal replays
  onClose: () => void; // Escape
  onDone: () => void; // Tutup button
};

type Ease = Transition["ease"];

const CSS_EASE: Ease = [0.25, 0.1, 0.25, 1]; // CSS "ease"
const SUN_EASE: Ease = [0.2, 0.7, 0.2, 1];
// "Fajar menyingsing" (3c) timeline, [delay, duration] in ms. Based on the design handoff, except the
// dots wait for the state text to finish (2250 + 500) and the reference + Tutup shift with them.
const T = {
  dawn: [0, 1300],
  sun: [0, 1400],
  emoji: [700, 600],
  eyebrow: [900, 400],
  name: [950, 650],
  line: [1550, 800],
  state: [2250, 500],
  dots: [2750, 380], // + 55ms per dot
  ref: [2950, 400],
  close: [3100, 450],
} as const;

/** The Tutup button has finished rising; focus moves to it then. */
const REVEAL_MS = T.close[0] + T.close[1];

const rise = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};
const fade = { initial: { opacity: 0 }, animate: { opacity: 1 } };
// Wipes left to right across the whole block, so a two-line daily line reveals both lines together.
const write = {
  initial: { clipPath: "inset(0 100% 0 0)" },
  animate: { clipPath: "inset(0 0% 0 0)" },
};

/** Full-screen Buah Roh card shown after every Amen tap. Closes only via Tutup, Escape or back. */
export function FruitOfSpiritCard({ result, playKey, onClose, onDone }: Props) {
  const reduce = useReducedMotion();
  const { locale } = useLocale();
  const m = messages[locale];
  const closeRef = useRef<HTMLButtonElement>(null);

  // Reduced motion: no delays, no durations — the final state appears at once.
  const tr = ([delay, duration]: readonly [number, number], ease: Ease = CSS_EASE): Transition =>
    reduce ? { duration: 0 } : { delay: delay / 1000, duration: duration / 1000, ease };

  useEffect(() => {
    if (!result) return;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), reduce ? 0 : REVEAL_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [result, playKey, reduce, onClose]);

  const view = result?.state;
  const day = view?.dayInFruit ?? 1;
  const fruitName = view ? (locale === "en" ? view.fruit.en : view.fruit.name) : "";
  const stateText = result?.advanced ? m.fruitCardNormal(day) : m.fruitCardRepeat(day);

  return (
    <AnimatePresence>
      {result && view && (
        <motion.div
          key={playKey}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fruit-card-name"
          className="fixed inset-0 z-[100] overflow-hidden"
          initial={{ backgroundColor: "#3c3489" }}
          animate={{ backgroundColor: "#ffffff" }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={tr(T.dawn, "easeInOut")}
        >
          {/* sun */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-[200px] left-1/2 h-[580px] w-[580px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(250,199,117,.95) 0%, rgba(250,199,117,.45) 35%, rgba(238,237,254,0) 68%)",
            }}
            initial={{ opacity: 0, x: "-50%", y: "40%", scale: 0.5 }}
            animate={{ opacity: 1, x: "-50%", y: "0%", scale: 1 }}
            transition={tr(T.sun, SUN_EASE)}
          />

          <div className="relative h-full overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-[390px] flex-col items-center justify-center gap-[14px] px-6 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(32px,env(safe-area-inset-top))] text-center">
              <motion.div aria-hidden className="text-[54px] leading-[1.2]" {...rise} transition={tr(T.emoji)}>
                {view.fruit.emoji}
              </motion.div>

              <motion.p
                className="m-0 text-[12px] font-medium uppercase leading-4 tracking-[0.025em] text-[var(--vq-muted)]"
                {...fade}
                transition={tr(T.eyebrow)}
              >
                {m.fruitCardEyebrow}
              </motion.p>

              <motion.h2
                id="fruit-card-name"
                className="-mt-1.5 text-[38px] font-medium leading-[1.15] text-[var(--vq-text)]"
                {...write}
                transition={tr(T.name, "linear")}
              >
                {fruitName}
              </motion.h2>

              <motion.p
                className="m-0 max-w-[300px] text-[19px] leading-[1.5] text-[var(--vq-muted)] [text-wrap:pretty]"
                {...write}
                transition={tr(T.line, "linear")}
              >
                {view.fruit.line}
              </motion.p>

              <motion.p
                className="m-0 max-w-[300px] text-[16px] leading-[1.5] text-[var(--vq-text)]"
                {...fade}
                transition={tr(T.state)}
              >
                {stateText}
              </motion.p>

              {/* The whole row (empty rings too) appears only after the state text has finished. */}
              <motion.div
                className="flex gap-2"
                role="img"
                aria-label={m.fruitCardDotsAria(day)}
                {...fade}
                transition={tr([T.dots[0], 200])}
              >
                {Array.from({ length: DAYS_PER_FRUIT }, (_, i) => {
                  const done = i < day - 1;
                  const today = i === day - 1;
                  return (
                    <div
                      key={i}
                      aria-hidden
                      className="h-[26px] w-[26px] overflow-hidden rounded-full border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)]"
                    >
                      <motion.div
                        className={`flex h-full w-full items-center justify-center rounded-full text-[12px] font-semibold ${
                          done
                            ? "bg-[var(--vq-brand)] text-white"
                            : today
                              ? "bg-[var(--vq-today)] text-[var(--vq-today-ink)]"
                              : ""
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.3, 1] }}
                        transition={
                          reduce
                            ? { duration: 0 }
                            : {
                                delay: (T.dots[0] + i * 55) / 1000,
                                duration: T.dots[1] / 1000,
                                times: [0, 0.7, 1],
                                ease: "easeInOut",
                              }
                        }
                      >
                        {done ? "✓" : today ? "🙏" : ""}
                      </motion.div>
                    </div>
                  );
                })}
              </motion.div>

              <motion.p
                className="m-0 text-[13px] tabular-nums text-[var(--vq-brand)]"
                {...fade}
                transition={tr(T.ref)}
              >
                {m.fruitVerseRef}
              </motion.p>

              <motion.button
                ref={closeRef}
                type="button"
                onClick={onDone}
                className="mt-2 min-h-[56px] w-full rounded-2xl bg-[var(--vq-brand)] text-[18px] font-medium text-white hover:bg-[var(--vq-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vq-brand)] active:scale-[0.98]"
                {...rise}
                transition={tr(T.close)}
              >
                {m.fruitCardClose}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
