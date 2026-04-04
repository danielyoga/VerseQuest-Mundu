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

/** DD/MM/YYYY format used by the Devotion_and_Reflection sheet. */
export function getTodaySheetDate(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
