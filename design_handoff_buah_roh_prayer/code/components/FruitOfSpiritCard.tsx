// components/FruitOfSpiritCard.tsx
// "Fajar menyingsing" (3c). Framer Motion + Tailwind. Timings are final — do not change.
'use client';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import { FRUIT_VERSE_REF } from '@/lib/fruitsOfSpirit';
import type { AmenResult } from '@/lib/fruitStreak';

type Props = {
  result: AmenResult | null; // null = closed
  playKey: number;           // increment on every Amen tap to replay the animation
  onClose: () => void;
};

const CSS_EASE = [0.25, 0.1, 0.25, 1] as const;   // CSS "ease"
const SUN_EASE = [0.2, 0.7, 0.2, 1] as const;
const REVEAL_MS = 3150;

// Timeline (ms): [delay, duration]
const T = {
  dawn:  [0, 1300],
  sun:   [0, 1400],
  emoji: [700, 600],
  eyebrow: [900, 400],
  name:  [950, 650],
  line:  [1550, 800],
  state: [2250, 500],
  dots:  [2350, 380], // + 55ms per dot
  ref:   [2550, 400],
  close: [2700, 450],
} as const;

const rise = { initial: { opacity: 0, y: 12, filter: 'blur(4px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' } };
const fade = { initial: { opacity: 0 }, animate: { opacity: 1 } };
const write = { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: { clipPath: 'inset(0 0% 0 0)' } };

export default function FruitOfSpiritCard({ result, playKey, onClose }: Props) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  const tr = ([d, dur]: readonly [number, number], ease: Transition['ease'] = CSS_EASE as unknown as Transition['ease']): Transition =>
    reduce ? { duration: 0 } : { delay: d / 1000, duration: dur / 1000, ease };

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => closeRef.current?.focus(), reduce ? 0 : REVEAL_MS);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [result, playKey, reduce, onClose]);

  const view = result?.state;
  const day = view?.dayInFruit ?? 1;
  const stateText = result?.advanced
    ? `Hari ${day} dari 7. Terus setia berdoa ya!`
    : `Kamu sudah berdoa hari ini. Hari ${day} dari 7.`;

  return (
    <AnimatePresence>
      {result && view && (
        <motion.div
          key={playKey}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fruit-card-name"
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ backgroundColor: '#3c3489' }}
          animate={{ backgroundColor: '#ffffff' }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={tr(T.dawn, 'easeInOut')}
        >
          {/* sun */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 -bottom-[200px] h-[580px] w-[580px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(250,199,117,.95) 0%, rgba(250,199,117,.45) 35%, rgba(238,237,254,0) 68%)' }}
            initial={{ opacity: 0, x: '-50%', y: '40%', scale: 0.5 }}
            animate={{ opacity: 1, x: '-50%', y: '0%', scale: 1 }}
            transition={tr(T.sun, SUN_EASE as unknown as Transition['ease'])}
          />

          <div className="relative mx-auto flex h-full max-w-[390px] flex-col items-center justify-center gap-[14px] px-6 py-8 text-center">
            <motion.div aria-hidden className="text-[54px] leading-[1.2]" {...rise} transition={tr(T.emoji)}>
              {view.fruit.emoji}
            </motion.div>

            <motion.div className="text-[12px] font-medium uppercase leading-4 tracking-[0.025em] text-[var(--vq-muted)]" {...fade} transition={tr(T.eyebrow)}>
              Buah Roh hari ini
            </motion.div>

            <motion.h2 id="fruit-card-name" className="-mt-1.5 text-[38px] font-medium leading-[1.15] text-[var(--vq-text)]" {...write} transition={tr(T.name, 'linear')}>
              {view.fruit.name}
            </motion.h2>

            <motion.p className="max-w-[300px] text-[19px] leading-[1.5] text-[var(--vq-muted)] [text-wrap:pretty]" {...write} transition={tr(T.line, 'linear')}>
              {view.fruit.line}
            </motion.p>

            <motion.p className="max-w-[300px] text-[16px] leading-[1.5] text-[var(--vq-text)]" {...fade} transition={tr(T.state)}>
              {stateText}
            </motion.p>

            <div className="flex gap-2" aria-label={`Hari ${day} dari 7`}>
              {Array.from({ length: 7 }, (_, i) => {
                const done = i < day - 1;
                const today = i === day - 1;
                return (
                  <div key={i} aria-hidden className="h-[26px] w-[26px] overflow-hidden rounded-full border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)]">
                    <motion.div
                      className={[
                        'flex h-full w-full items-center justify-center rounded-full text-[12px] font-semibold',
                        done ? 'bg-[var(--vq-brand)] text-white' : today ? 'bg-[var(--vq-today)] text-[var(--vq-today-ink)]' : '',
                      ].join(' ')}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={reduce ? { duration: 0 } : { delay: (T.dots[0] + i * 55) / 1000, duration: T.dots[1] / 1000, times: [0, 0.7, 1], ease: 'easeInOut' }}
                    >
                      {done ? '✓' : today ? '🙏' : ''}
                    </motion.div>
                  </div>
                );
              })}
            </div>

            <motion.div className="text-[13px] tabular-nums text-[var(--vq-brand)]" {...fade} transition={tr(T.ref)}>
              {FRUIT_VERSE_REF}
            </motion.div>

            <motion.button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="mt-2 min-h-[56px] w-full rounded-2xl bg-[var(--vq-brand)] text-[18px] font-medium text-white hover:bg-[var(--vq-brand-hover)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vq-brand)]"
              {...rise}
              transition={tr(T.close)}
            >
              Tutup
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
