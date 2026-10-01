import { describe, expect, it } from "vitest";
import { pickPrayer, validatePrayerText } from "@/lib/prayer-content";

const rows = [
  { date: "2026-10-01", text: "Doa satu" },
  { date: "2026-10-03", text: "Doa tiga" },
  { date: "2026-10-05", text: "  " },
  { date: "01/10/2026", text: "Format salah" },
];

describe("pickPrayer", () => {
  it("TC17/TC18 exact date wins, whatever the time of day", () => {
    expect(pickPrayer(rows, "2026-10-03")?.text).toBe("Doa tiga");
  });

  it("TC19 no row for today → most recent earlier row", () => {
    expect(pickPrayer(rows, "2026-10-02")?.text).toBe("Doa satu");
  });

  it("skips empty text and future rows", () => {
    expect(pickPrayer(rows, "2026-10-05")?.text).toBe("Doa tiga");
  });

  it("TC20 nothing usable → null (route serves the default)", () => {
    expect(pickPrayer([], "2026-10-01")).toBeNull();
    expect(pickPrayer(rows, "2026-09-30")).toBeNull();
  });
});

describe("validatePrayerText", () => {
  it("TC24 only spaces → empty", () => {
    expect(validatePrayerText("   \n  ")).toEqual({ ok: false, error: "empty" });
  });

  it("TC24 1001 characters → too_long; 1000 is fine", () => {
    expect(validatePrayerText("a".repeat(1001))).toEqual({ ok: false, error: "too_long" });
    expect(validatePrayerText("a".repeat(1000)).ok).toBe(true);
  });

  it("strips HTML, keeps line breaks, trims", () => {
    expect(validatePrayerText("  <b>Tuhan</b>,\r\nterima kasih. ")).toEqual({
      ok: true,
      text: "Tuhan,\nterima kasih.",
    });
  });
});
