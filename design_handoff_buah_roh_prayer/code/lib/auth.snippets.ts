// Integration snippets — merge into the existing login / logout handlers.
import { ensurePersistentStorage } from '@/lib/fruitStreak';

const SESSION_KEY = 'vq_session'; // TODO: use the app's real session key name

// Login success handler
export async function onLoginSuccess(session: { phone: string }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  await ensurePersistentStorage(); // idempotent; errors swallowed inside
}

// Logout handler
export function onLogout() {
  // ✅ remove ONLY the session key
  localStorage.removeItem(SESSION_KEY);
  // ❌ never: localStorage.clear()  — it deletes every vq_fruit_streak_v1:* on the device
}
