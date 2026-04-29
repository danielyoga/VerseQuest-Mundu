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
