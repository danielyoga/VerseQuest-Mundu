import { describe, it, expect } from "vitest";
import { isUsableCachedScheduleDay } from "@/lib/schedule/window-cache";
import type { ScheduleWindowDay } from "@/lib/schedule/window-types";

const OK_DAY: ScheduleWindowDay = {
  year: 2026,
  month: 6,
  date: 1,
  ok: true,
  book: "John",
  reading: "1:1-5",
  verses: [{ chapter: 1, verse: 1, text: "In the beginning was the Word" }],
};

describe("isUsableCachedScheduleDay", () => {
  it("returns true for a valid ok day with verses", () => {
    expect(isUsableCachedScheduleDay(OK_DAY)).toBe(true);
  });

  it("returns false for no_row", () => {
    const day: ScheduleWindowDay = {
      year: 2026,
      month: 6,
      date: 1,
      ok: false,
      reason: "no_row",
    };
    expect(isUsableCachedScheduleDay(day)).toBe(false);
  });

  it("returns false for verses_empty", () => {
    const day: ScheduleWindowDay = {
      year: 2026,
      month: 6,
      date: 1,
      ok: false,
      reason: "verses_empty",
      book: "John",
      reading: "1:1-5",
    };
    expect(isUsableCachedScheduleDay(day)).toBe(false);
  });

  it("returns false for verses_invalid", () => {
    const day: ScheduleWindowDay = {
      year: 2026,
      month: 6,
      date: 1,
      ok: false,
      reason: "verses_invalid",
      book: "John",
      reading: "1:1-5",
    };
    expect(isUsableCachedScheduleDay(day)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isUsableCachedScheduleDay(undefined)).toBe(false);
  });
});
