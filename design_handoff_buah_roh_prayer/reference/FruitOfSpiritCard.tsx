// Reference implementation. Values match "Buah Roh Prayer Final.dc.html" exactly.
// Adapt to the codebase (Tailwind classes / Framer Motion) — keep the numbers.
'use client';
import { useEffect, useRef } from 'react';
import { FRUITS, FRUIT_VERSE_REF } from '@/lib/fruitsOfSpirit'; // FRUITS items need a `line` field (see README)
import './fruit-card.css';

type Props = {
  open: boolean;
  fruitIndex: number;   // from getFruitState / recordAmen().state
  dayInFruit: number;   // 1..7
  advanced: boolean;    // recordAmen().advanced — false = same-day repeat
  onClose: () => void;
};

const REVEAL_MS = 3150;

export default function FruitOfSpiritCard({ open, fruitIndex, dayInFruit, advanced, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const fruit = FRUITS[fruitIndex];

  useEffect(() => {
    if (!open) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => closeRef.current?.focus(), reduce ? 0 : REVEAL_MS);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const state = advanced
    ? `Hari ${dayInFruit} dari 7. Terus setia berdoa ya!`
    : `Kamu sudah berdoa hari ini. Hari ${dayInFruit} dari 7.`;

  return (
    // key forces the animation to replay on every Amen tap
    <div key={Date.now()} className="fc" role="dialog" aria-modal="true" aria-labelledby="fc-name">
      <div className="fc__sun" aria-hidden />
      <div className="fc__col">
        <div className="fc__emoji" aria-hidden>{fruit.emoji}</div>
        <div className="eyebrow fc__eyebrow">Buah Roh hari ini</div>
        <h2 id="fc-name" className="fc__name">{fruit.name}</h2>
        <p className="fc__line" style={{ margin: 0 }}>{fruit.line}</p>
        <p className="fc__state" style={{ margin: 0 }}>{state}</p>
        <div className="fc__dots" aria-label={`Hari ${dayInFruit} dari 7`}>
          {Array.from({ length: 7 }, (_, i) => {
            const done = i < dayInFruit - 1, today = i === dayInFruit - 1;
            return (
              <div key={i} className="dot" aria-hidden>
                <div
                  className={`dot__fill ${done ? 'dot__fill--done' : today ? 'dot__fill--today' : ''}`}
                  style={{ animationDelay: `${2350 + i * 55}ms` }}
                >{done ? '✓' : today ? '🙏' : ''}</div>
              </div>
            );
          })}
        </div>
        <div className="fc__ref">{FRUIT_VERSE_REF}</div>
        <button ref={closeRef} className="btn fc__close" onClick={onClose}>Tutup</button>
      </div>
    </div>
  );
}
