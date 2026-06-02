/** Server-side verbose logs (API routes, proxy). Set VERSEQUEST_DEBUG_LOGS=1 on Vercel to enable. */
export function isServerDebugLog(): boolean {
  return process.env.VERSEQUEST_DEBUG_LOGS === "1";
}

export function serverDebugLog(tag: string, ...args: unknown[]): void {
  if (isServerDebugLog()) console.log(`[${tag}]`, ...args);
}

export function isClientDebugLog(): boolean {
  return process.env.NODE_ENV === "development";
}

export function clientDebugLog(tag: string, ...args: unknown[]): void {
  if (isClientDebugLog()) console.log(`[${tag}]`, ...args);
}
