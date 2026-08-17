const PER_IP_LIMIT = 5;
const PER_IP_WINDOW_MS = 10 * 60_000;
const GLOBAL_LIMIT = 40;
const GLOBAL_WINDOW_MS = 60 * 60_000;
const MAX_TRACKED_IPS = 500;

type Window = { count: number; resetAt: number };

// Per-instance state: on serverless this resets with the instance, so it guards
// against bursts rather than acting as a distributed quota.
const ipWindows = new Map<string, Window>();
let globalWindow: Window = { count: 0, resetAt: 0 };

export type RateLimitVerdict = { ok: true } | { ok: false; retryAfterSec: number };

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function prune(now: number) {
  if (ipWindows.size <= MAX_TRACKED_IPS) return;
  ipWindows.forEach((window, ip) => {
    if (window.resetAt <= now) ipWindows.delete(ip);
  });
}

function take(window: Window, now: number, windowMs: number, limit: number): Window & { allowed: boolean } {
  if (window.resetAt <= now) {
    return { count: 1, resetAt: now + windowMs, allowed: true };
  }
  if (window.count >= limit) {
    return { ...window, allowed: false };
  }
  return { count: window.count + 1, resetAt: window.resetAt, allowed: true };
}

export function checkRateLimit(ip: string): RateLimitVerdict {
  const now = Date.now();
  prune(now);

  const global = take(globalWindow, now, GLOBAL_WINDOW_MS, GLOBAL_LIMIT);
  if (!global.allowed) {
    return { ok: false, retryAfterSec: Math.ceil((global.resetAt - now) / 1000) };
  }

  const perIp = take(
    ipWindows.get(ip) ?? { count: 0, resetAt: 0 },
    now,
    PER_IP_WINDOW_MS,
    PER_IP_LIMIT
  );
  if (!perIp.allowed) {
    return { ok: false, retryAfterSec: Math.ceil((perIp.resetAt - now) / 1000) };
  }

  globalWindow = { count: global.count, resetAt: global.resetAt };
  ipWindows.set(ip, { count: perIp.count, resetAt: perIp.resetAt });
  return { ok: true };
}
