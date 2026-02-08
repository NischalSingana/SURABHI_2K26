/**
 * Simple in-memory rate limiter for the chatbot API to prevent spam/abuse.
 * Limits: max REQUESTS_PER_WINDOW requests per WINDOW_MS per identifier (e.g. IP).
 */

const REQUESTS_PER_WINDOW = 20;
const WINDOW_MS = 60 * 1000; // 1 minute

const store = new Map<
  string,
  { count: number; resetAt: number }
>();

function getIdentifier(ip: string | null): string {
  return ip?.trim() || "anonymous";
}

export function checkRateLimit(ip: string | null): { allowed: boolean; retryAfterSeconds?: number } {
  const id = getIdentifier(ip);
  const now = Date.now();
  const entry = store.get(id);

  if (!entry) {
    store.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (now >= entry.resetAt) {
    store.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}
