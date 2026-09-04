import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { getTodayDayJakarta } from "@/lib/sheetName";

const valuesGet = vi.fn();

vi.mock("@/lib/google-sheets/client", () => ({
  getSheetsClient: vi.fn(async () => ({
    spreadsheets: { values: { get: valuesGet } },
  })),
  getSpreadsheetId: vi.fn(() => "sheet-id"),
}));

vi.mock("@/lib/coordinators", () => ({
  getCoordinatorRanting: vi.fn(() => "Ranting A"),
  isCoordinatorForRanting: vi.fn(() => true),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function makeRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/coordinator/members");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

describe("GET /api/coordinator/members", () => {
  it("marks every response no-store, so a browser/CDN never reuses a prior day's snapshot", async () => {
    const { GET } = await import("@/app/api/coordinator/members/route");
    const today = getTodayDayJakarta();
    valuesGet.mockResolvedValue({
      data: {
        values: [
          ["Phone", "Name", String(today)],
          ["0811", "Ada", ""],
        ],
      },
    });

    const res = await GET(makeRequest({ phone: "0811", ranting: "Ranting A" }));

    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.members).toEqual([{ phone: "0811", name: "Ada", submitted_today: false }]);
  });

  it("recomputes submitted_today from the current day column on every call — same URL, different day data", async () => {
    const { GET } = await import("@/app/api/coordinator/members/route");
    const today = getTodayDayJakarta();
    const req = () => makeRequest({ phone: "0811", ranting: "Ranting A" });

    // First call: today's cell is empty -> not submitted yet.
    valuesGet.mockResolvedValueOnce({
      data: { values: [["Phone", "Name", String(today)], ["0811", "Ada", ""]] },
    });
    const first = await GET(req());
    const firstBody = await first.json();
    expect(firstBody.members[0].submitted_today).toBe(false);

    // Second call, identical request URL/params, but the sheet now has a value for today.
    valuesGet.mockResolvedValueOnce({
      data: { values: [["Phone", "Name", String(today)], ["0811", "Ada", "John 1:1"]] },
    });
    const second = await GET(req());
    const secondBody = await second.json();
    expect(secondBody.members[0].submitted_today).toBe(true);

    // Both responses opt out of caching, so a client refetching the identical URL
    // is guaranteed to see this transition instead of a stale "all done" snapshot.
    expect(first.headers.get("cache-control")).toBe("no-store");
    expect(second.headers.get("cache-control")).toBe("no-store");
  });

  it("returns no-store even on the 403 access-denied path", async () => {
    const { isCoordinatorForRanting } = await import("@/lib/coordinators");
    vi.mocked(isCoordinatorForRanting).mockReturnValueOnce(false);
    const { GET } = await import("@/app/api/coordinator/members/route");

    const res = await GET(makeRequest({ phone: "0000", ranting: "Ranting A" }));

    expect(res.status).toBe(403);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("returns no-store on the 500 error path", async () => {
    valuesGet.mockRejectedValueOnce(new Error("sheets API down"));
    const { GET } = await import("@/app/api/coordinator/members/route");

    const res = await GET(makeRequest({ phone: "0811", ranting: "Ranting A" }));

    expect(res.status).toBe(500);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
