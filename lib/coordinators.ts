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

  return raw.split(",").flatMap((entry) => {
    const [phone, ranting] = entry.trim().split(":");
    if (!phone || !ranting) return [];
    const p = phone.trim();
    const r = ranting.trim();
    console.log(`[coordinators] registered: "${p}" → ranting="${r}"`);
    return [{ phone: p, ranting: r }];
  });
}

export function getCoordinatorRanting(phone: string): string | null {
  const entries = parseCoordinators();
  const match = entries.find((e) => phoneMatches(e.phone, phone));
  console.log(`[coordinators] check: "${phone}" → ${match ? `ranting="${match.ranting}"` : "no match"}`);
  return match?.ranting ?? null;
}

export function isCoordinator(phone: string): boolean {
  return getCoordinatorRanting(phone) !== null;
}
