// POST /api/admin/prayer — admin check, validation, upsert + cache expiry (TC23–TC25). Sheets is mocked.
import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertPrayerRow = vi.fn(async () => ({ updated: false }));
const revalidateTag = vi.fn();

vi.mock("@/lib/google-sheets/prayers-sheet", () => ({
  upsertPrayerRow,
  readPrayerRows: vi.fn(async () => []),
}));
vi.mock("next/cache", () => ({
  revalidateTag,
  unstable_cache: <T,>(fn: T) => fn,
}));

const { POST } = await import("@/app/api/admin/prayer/route");
const { DEVOTION_ADMIN_PHONE } = await import("@/lib/constants");

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/admin/prayer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

beforeEach(() => {
  upsertPrayerRow.mockClear();
  revalidateTag.mockClear();
});

describe("POST /api/admin/prayer", () => {
  it("TC23 normal member → 403, nothing written", async () => {
    const res = await post({ phone: "+6281200000001", date: "2026-10-01", text: "Doa" });
    expect(res.status).toBe(403);
    expect(upsertPrayerRow).not.toHaveBeenCalled();
  });

  it("TC24 1001 characters or only spaces → 400, nothing written", async () => {
    for (const text of ["a".repeat(1001), "    "]) {
      const res = await post({ phone: DEVOTION_ADMIN_PHONE, date: "2026-10-01", text });
      expect(res.status).toBe(400);
    }
    expect(upsertPrayerRow).not.toHaveBeenCalled();
  });

  it("rejects a bad date", async () => {
    const res = await post({ phone: DEVOTION_ADMIN_PHONE, date: "01/10/2026", text: "Doa" });
    expect(res.status).toBe(400);
    expect(upsertPrayerRow).not.toHaveBeenCalled();
  });

  it("TC25 admin save → upserts sanitized text and expires the prayers cache", async () => {
    const res = await post({ phone: DEVOTION_ADMIN_PHONE, date: "2026-10-01", text: " <i>Tuhan</i>, terima kasih. " });
    expect(res.status).toBe(200);
    expect(upsertPrayerRow).toHaveBeenCalledWith("2026-10-01", "Tuhan, terima kasih.", DEVOTION_ADMIN_PHONE);
    expect(revalidateTag).toHaveBeenCalledWith("prayers", { expire: 0 });
  });
});
