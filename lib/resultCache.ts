import type { AgentEvent } from './types';
import type { Locale } from './i18n';

const TTL_MS = 30 * 60_000;
const MAX_ENTRIES = 40;

type Entry = { events: AgentEvent[]; storedAt: number };

const cache = new Map<string, Entry>();

export function runKey(locale: Locale, products: string[], preference: string): string {
  return [
    locale,
    preference.trim().toLowerCase(),
    ...products.map((p) => p.trim().toLowerCase()),
  ].join('|');
}

export function readCachedRun(key: string): AgentEvent[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.events;
}

export function writeCachedRun(key: string, events: AgentEvent[]) {
  if (!events.some((event) => event.type === 'result')) return;
  cache.set(key, { events, storedAt: Date.now() });
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
}
