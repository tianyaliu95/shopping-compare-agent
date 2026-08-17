import type { Locale } from '../i18n';
import type { AgentEvent } from '../types';
import examples from './examples.json';

export type Seed = {
  id: string;
  locale: Locale;
  products: string[];
  preference: string;
  capturedAt: string;
  events: AgentEvent[];
};

const seeds = examples as Seed[];

function key(locale: Locale, products: string[], preference: string) {
  return [
    locale,
    preference.trim().toLowerCase(),
    ...products.map((p) => p.trim().toLowerCase()),
  ].join('|');
}

const byKey = new Map(seeds.map((seed) => [key(seed.locale, seed.products, seed.preference), seed]));

export function findSeed(
  locale: Locale,
  products: string[],
  preference: string
): Seed | null {
  return byKey.get(key(locale, products, preference)) ?? null;
}
