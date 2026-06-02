import { isServerDebugLog } from "@/lib/log";

export interface CoordinatorEntry {
  phone: string;
  ranting: string;
}

let cachedEntries: Array<{ phone: string; ranting: string }> | null = null;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

// "081357049895" ends with "81357049895" → match
// "6281357049895" ends with "81357049895" → match
function phoneMatches(a: string, b: string): boolean {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  return da.endsWith(db) || db.endsWith(da);
}

function parseCoordinators(): Array<{ phone: string; ranting: string }> {
  if (cachedEntries) return cachedEntries;

  const raw = process.env.COORDINATORS ?? "";
  if (!raw.trim()) {
    cachedEntries = [];
    return cachedEntries;
  }

  cachedEntries = raw.split(",").flatMap((entry) => {
    const [phone, ranting] = entry.trim().split(":");
    if (!phone || !ranting) return [];
    return [{ phone: phone.trim(), ranting: ranting.trim() }];
  });
  if (isServerDebugLog()) {
    console.log(`[coordinators] loaded ${cachedEntries.length} entries`);
  }
  return cachedEntries;
}

export function getCoordinatorRanting(phone: string): string | null {
  const entries = parseCoordinators();
  const match = entries.find((e) => phoneMatches(e.phone, phone));
  return match?.ranting ?? null;
}

/** Verify that `phone` is registered as a coordinator for the given `ranting` specifically. */
export function isCoordinatorForRanting(phone: string, ranting: string): boolean {
  const entries = parseCoordinators();
  return entries.some(
    (e) =>
      phoneMatches(e.phone, phone) &&
      e.ranting.toLowerCase() === ranting.toLowerCase()
  );
}

export function isCoordinator(phone: string): boolean {
  return getCoordinatorRanting(phone) !== null;
}
