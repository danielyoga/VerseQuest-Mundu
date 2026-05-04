/** Local calendar date YYYY-MM-DD */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns all calendar days from the 1st of the current month up to today, oldest first. */
export function getCurrentMonthDayStrings(anchor: Date = new Date()): string[] {
  const out: string[] = [];
  const today = new Date(anchor);
  const todayDay = today.getDate();
  for (let i = 1; i <= todayDay; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), i);
    out.push(toLocalDateString(d));
  }
  return out;
}

/**
 * Monday–Sunday local dates (7 entries), same week logic as streak week dots (ISO week, Monday start).
 */
export function getLocalWeekDateStrings(anchor: Date = new Date()): string[] {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    out.push(toLocalDateString(x));
  }
  return out;
}
