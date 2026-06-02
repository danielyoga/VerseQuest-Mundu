import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchTbChapterVerses } from "@/lib/bible/alkitab-mobi";
import { fetchPassageVersesFromReading } from "@/lib/bible/fetch-passage-verses";

vi.mock("@/lib/bible/alkitab-mobi", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/bible/alkitab-mobi")>(
      "@/lib/bible/alkitab-mobi"
    );
  return { ...actual, fetchTbChapterVerses: vi.fn() };
});

afterEach(() => vi.clearAllMocks());

describe("fetchPassageVersesFromReading", () => {
  it("returns verse objects with chapter/verse/text for a valid reading", async () => {
    vi.mocked(fetchTbChapterVerses).mockResolvedValue(
      new Map([
        [1, "In the beginning was the Word"],
        [2, "and the Word was with God"],
        [3, "and the Word was God"],
      ])
    );

    const result = await fetchPassageVersesFromReading("John", "1:1-3");

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ chapter: 1, verse: 1, text: "In the beginning was the Word" });
    expect(result[1]).toMatchObject({ chapter: 1, verse: 2, text: "and the Word was with God" });
    expect(result[2]).toMatchObject({ chapter: 1, verse: 3, text: "and the Word was God" });
  });

  it("throws 'unknown_book' for an unrecognised book abbreviation", async () => {
    await expect(
      fetchPassageVersesFromReading("FakeBook", "1:1-5")
    ).rejects.toThrow("unknown_book");

    expect(vi.mocked(fetchTbChapterVerses)).not.toHaveBeenCalled();
  });

  it("throws 'passage_too_long' when verse count exceeds the limit (Psalms 1:1-150:6)", async () => {
    // Psalms spans 150 chapters — total verses far exceeds MAX_PASSAGE_VERSES (300).
    // The check happens before any HTTP call so fetchTbChapterVerses is never invoked.
    await expect(
      fetchPassageVersesFromReading("Psalms", "1:1-150:6")
    ).rejects.toThrow("passage_too_long");

    expect(vi.mocked(fetchTbChapterVerses)).not.toHaveBeenCalled();
  });
});
