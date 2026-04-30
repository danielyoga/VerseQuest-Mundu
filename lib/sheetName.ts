const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export function getCurrentSheetName(ranting: string): string {
  const now = new Date();
  return `${ranting}_${MONTH_NAMES[now.getMonth()]}`;
}

export function getSheetName(ranting: string, date: Date): string {
  return `${ranting}_${MONTH_NAMES[date.getMonth()]}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

/** Day-of-month (1–31) in Jakarta time. */
export function getTodayDayJakarta(): number {
  return parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", day: "numeric" }).format(new Date()),
    10
  );
}

/** A1-notation column letter for a 0-based column index (0=A, 25=Z, 26=AA…). */
export function colLetter(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  return String.fromCharCode(65 + Math.floor(index / 26) - 1) + String.fromCharCode(65 + (index % 26));
}

/** DD/MM/YYYY format used by the Devotion_and_Reflection sheet, in Jakarta local time. */
export function getTodaySheetDate(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("day")}/${get("month")}/${get("year")}`;
}
