import { getTodayString } from "@/lib/sheetName";

export type DevotionTodayPayload = {
  devotion?: string | null;
  devotionTitle?: string | null;
  reflection?: string[];
};

let cachedDate = "";
let cachedPayload: DevotionTodayPayload | null = null;
let inflight: Promise<DevotionTodayPayload> | null = null;

/** One in-flight request per day; shared by home shell and /devotional. */
export function fetchDevotionToday(): Promise<DevotionTodayPayload> {
  const today = getTodayString();
  if (cachedDate === today && cachedPayload) {
    return Promise.resolve(cachedPayload);
  }
  if (cachedDate !== today) {
    cachedDate = today;
    cachedPayload = null;
    inflight = null;
  }
  if (inflight) return inflight;

  inflight = fetch("/api/devotion/today", { cache: "no-store" })
    .then((r) => r.json() as Promise<DevotionTodayPayload>)
    .then((data) => {
      cachedPayload = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
