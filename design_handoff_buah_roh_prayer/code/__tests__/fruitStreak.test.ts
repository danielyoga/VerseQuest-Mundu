// __tests__/fruitStreak.test.ts — Vitest (environment: jsdom). Covers the addendum's test cases.
import { beforeEach, describe, expect, it } from 'vitest';
import { getFruitState, recordAmen, storageKey, toLocalDateStr } from '@/lib/fruitStreak';

const A = '081200000001';
const B = '081200000002';
const D = (n: number) => toLocalDateStr(new Date(2026, 0, n)); // D(1) = 2026-01-01
const seed = (phone: string, streak: number, day: number, cycles = 0) =>
  localStorage.setItem(storageKey(phone), JSON.stringify({ streak, lastAmenDate: D(day), cyclesCompleted: cycles }));

beforeEach(() => localStorage.clear()); // tests only — never in the app

describe('fruit streak', () => {
  it('TC01 first Amen', () => {
    const r = recordAmen(A, D(1));
    expect(r.state.streak).toBe(1);
    expect(r.state.fruit.name).toBe('Kelemahlembutan');
    expect(r.state.dayInFruit).toBe(1);
  });

  it('TC02 same-day repeat', () => {
    seed(A, 1, 1);
    const r = recordAmen(A, D(1));
    expect(r.advanced).toBe(false);
    expect(r.state.streak).toBe(1);
  });

  it('TC03 next day', () => {
    seed(A, 1, 1);
    expect(recordAmen(A, D(2)).state.dayInFruit).toBe(2);
  });

  it('TC04 fruit completed on day 7', () => {
    seed(A, 6, 6);
    const r = recordAmen(A, D(7));
    expect(r.state.streak).toBe(7);
    expect(r.fruitCompleted).toBe(true);
  });

  it('TC05 day 8 → Kasih day 1', () => {
    seed(A, 7, 7);
    const r = recordAmen(A, D(8));
    expect(r.state.fruit.name).toBe('Kasih');
    expect(r.state.dayInFruit).toBe(1);
  });

  it('TC06 missed day resets', () => {
    seed(A, 10, 10);
    const r = recordAmen(A, D(12));
    expect(r.state.streak).toBe(1);
    expect(r.wasReset).toBe(true);
  });

  it('TC07 day 63 completes the cycle', () => {
    seed(A, 62, 20);
    const r = recordAmen(A, D(21));
    expect(r.state.fruit.name).toBe('Penguasaan Diri');
    expect(r.state.dayInFruit).toBe(7);
    expect(r.cycleCompleted).toBe(true);
  });

  it('TC08 day 64 → new cycle', () => {
    seed(A, 63, 20);
    const r = recordAmen(A, D(21));
    expect(r.state.streak).toBe(64);
    expect(r.state.fruit.name).toBe('Kelemahlembutan');
    expect(r.state.cyclesCompleted).toBe(1);
  });

  it('TC10 clock moved backwards', () => {
    seed(A, 5, 5);
    expect(recordAmen(A, D(3)).state.streak).toBe(1);
  });

  it('TC11 users do not mix', () => {
    seed(A, 5, 5);
    recordAmen(B, D(6));
    expect(getFruitState(B, D(6)).streak).toBe(1);
    expect(getFruitState(A, D(5)).streak).toBe(5);
  });

  it('TC13 corrupt JSON → default', () => {
    localStorage.setItem(storageKey(A), '{oops');
    const v = getFruitState(A, D(1));
    expect(v.streak).toBe(0);
  });

  it('TC15 broken before any Amen', () => {
    seed(A, 3, 3);
    expect(getFruitState(A, D(5)).isBroken).toBe(true);
  });
});
