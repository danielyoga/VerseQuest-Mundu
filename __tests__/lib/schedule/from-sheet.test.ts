import { describe, it, expect, vi, afterEach } from "vitest";
import { lookupScheduleForDate } from "@/lib/schedule/from-sheet";
import type { ScheduleSheetData } from "@/lib/schedule/from-sheet";

afterEach(() => vi.restoreAllMocks());

/** Minimal ScheduleSheetData with header: Month | Date | Book | Reading | Verses */
function makeData(): ScheduleSheetData {
  return {
    rows: [["Month", "Date", "Book", "Reading", "Verses"]],
    iMonth: 0,
    iDate: 1,
    iBook: 2,
    iReading: 3,
    iVerses: 4,
    fallbackMonth: undefined,
  };
}

function withRow(
  data: ScheduleSheetData,
  month: number,
  date: number,
  book: string,
  reading: string,
  verses: string
): ScheduleSheetData {
  return {
    ...data,
    rows: [...data.rows, [String(month), String(date), book, reading, verses]],
  };
}

const VALID_VERSES = JSON.stringify([
  { chapter: 1, verse: 1, text: "In the beginning was the Word" },
]);
const TYPO_KEY_VERSES = JSON.stringify([
  { "1erse": 1, chapter: 1, text: "In the beginning was the Word" },
]);
const NON_ARRAY_VERSES = JSON.stringify({
  chapter: 1,
  verse: 1,
  text: "In the beginning was the Word",
});
const EMPTY_ARRAY_VERSES = JSON.stringify([]);

describe("lookupScheduleForDate", () => {
  it("returns ok:true with verses for a valid row", () => {
    const data = withRow(makeData(), 6, 1, "John", "1:1-1", VALID_VERSES);
    const result = lookupScheduleForDate(data, 6, 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.verses).toHaveLength(1);
      expect(result.verses[0]).toMatchObject({
        chapter: 1,
        verse: 1,
        text: "In the beginning was the Word",
      });
      expect(result.book).toBe("John");
    }
  });

  it("returns verses_invalid when verse key is a typo ('1erse')", () => {
    const data = withRow(makeData(), 6, 1, "John", "1:1-1", TYPO_KEY_VERSES);
    const result = lookupScheduleForDate(data, 6, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("verses_invalid");
  });

  it("emits console.warn naming the bad keys when items are silently discarded", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const data = withRow(makeData(), 6, 1, "John", "1:1-1", TYPO_KEY_VERSES);
    lookupScheduleForDate(data, 6, 1);

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain("1erse");
  });

  it("returns verses_empty for a row with an empty verses cell", () => {
    const data = withRow(makeData(), 6, 1, "John", "1:1-1", "");
    const result = lookupScheduleForDate(data, 6, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("verses_empty");
  });

  it("returns verses_invalid for a non-array JSON value", () => {
    const data = withRow(makeData(), 6, 1, "John", "1:1-1", NON_ARRAY_VERSES);
    const result = lookupScheduleForDate(data, 6, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("verses_invalid");
  });

  it("returns verses_invalid for an empty JSON array", () => {
    const data = withRow(makeData(), 6, 1, "John", "1:1-1", EMPTY_ARRAY_VERSES);
    const result = lookupScheduleForDate(data, 6, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("verses_invalid");
  });

  it("returns no_row when no sheet row matches the requested date", () => {
    const result = lookupScheduleForDate(makeData(), 6, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no_row");
  });

  it("does not match a row for a different month", () => {
    const data = withRow(makeData(), 5, 1, "John", "1:1-1", VALID_VERSES);
    const result = lookupScheduleForDate(data, 6, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no_row");
  });

  describe("date cell format variants", () => {
    it("parses ISO format YYYY-MM-DD", () => {
      const data: ScheduleSheetData = {
        rows: [
          ["Date", "Book", "Reading", "Verses"],
          ["2026-06-01", "John", "1:1-1", VALID_VERSES],
        ],
        iMonth: -1,
        iDate: 0,
        iBook: 1,
        iReading: 2,
        iVerses: 3,
        fallbackMonth: undefined,
      };
      expect(lookupScheduleForDate(data, 6, 1).ok).toBe(true);
    });

    it("parses DD/MM/YYYY format", () => {
      const data: ScheduleSheetData = {
        rows: [
          ["Date", "Book", "Reading", "Verses"],
          ["01/06/2026", "John", "1:1-1", VALID_VERSES],
        ],
        iMonth: -1,
        iDate: 0,
        iBook: 1,
        iReading: 2,
        iVerses: 3,
        fallbackMonth: undefined,
      };
      expect(lookupScheduleForDate(data, 6, 1).ok).toBe(true);
    });

    it("uses month column when date cell is day-only", () => {
      const data: ScheduleSheetData = {
        rows: [
          ["Month", "Date", "Book", "Reading", "Verses"],
          ["6", "1", "John", "1:1-1", VALID_VERSES],
        ],
        iMonth: 0,
        iDate: 1,
        iBook: 2,
        iReading: 3,
        iVerses: 4,
        fallbackMonth: undefined,
      };
      expect(lookupScheduleForDate(data, 6, 1).ok).toBe(true);
    });

    it("uses fallbackMonth when no month column and date cell is day-only", () => {
      const data: ScheduleSheetData = {
        rows: [
          ["Date", "Book", "Reading", "Verses"],
          ["1", "John", "1:1-1", VALID_VERSES],
        ],
        iMonth: -1,
        iDate: 0,
        iBook: 1,
        iReading: 2,
        iVerses: 3,
        fallbackMonth: 6,
      };
      expect(lookupScheduleForDate(data, 6, 1).ok).toBe(true);
    });
  });
});
