export interface AppUser {
  phone: string;
  name: string;
  ranting: string;
}

const KEY = "versequest_user";

export function saveSession(user: AppUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getSession(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
