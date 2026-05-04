export interface CoordinatorEntry {
  phone: string;
  ranting: string;
}

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
  const raw = process.env.COORDINATORS ?? "";
  if (!raw.trim()) {
    console.log("[coordinators] COORDINATORS env var is empty or unset");
    return [];
  }

  const entries = raw.split(",").flatMap((entry) => {
    const [phone, ranting] = entry.trim().split(":");
    if (!phone || !ranting) return [];
    return [{ phone: phone.trim(), ranting: ranting.trim() }];
  });
  console.log(`[coordinators] loaded ${entries.length} entries`);
  return entries;
}

export function getCoordinatorRanting(phone: string): string | null {
  const entries = parseCoordinators();
  const allMatches = entries.filter((e) => phoneMatches(e.phone, phone));
  const match = allMatches[0] ?? null;
  console.log(
    `[coordinators] getCoordinatorRanting phone="${phone}" candidates=${allMatches.map((e) => `${e.phone}:${e.ranting}`).join(",")||"none"} → ${match ? `ranting="${match.ranting}"` : "no match"}`
  );
  return match?.ranting ?? null;
}

/** Verify that `phone` is registered as a coordinator for the given `ranting` specifically. */
export function isCoordinatorForRanting(phone: string, ranting: string): boolean {
  const entries = parseCoordinators();
  const allMatches = entries.filter((e) => phoneMatches(e.phone, phone));
  const match = allMatches.find((e) => e.ranting.toLowerCase() === ranting.toLowerCase());
  console.log(
    `[coordinators] isCoordinatorForRanting phone="${phone}" ranting="${ranting}" candidates=${allMatches.map((e) => `${e.phone}:${e.ranting}`).join(",")||"none"} → ${match ? "ok" : "denied"}`
  );
  return match !== undefined;
}

export function isCoordinator(phone: string): boolean {
  return getCoordinatorRanting(phone) !== null;
}
