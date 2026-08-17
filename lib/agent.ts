import { fetchPage, runTool } from './tools';
import type { AgentEvent, CompareResult } from './types';
import { copy, type Locale } from './i18n';
import { amazonAsin, parseProductList, type ProductInput } from './productInput';

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';

function systemPrompt(locale: Locale, hasUrls: boolean) {
  const lang =
    locale === 'zh'
      ? 'Write columns, cell text, pick.reason, and wins values in Simplified Chinese. Keep product names in their original form.'
      : 'Write columns, cell text, pick.reason, and wins values in English.';
  const urlRule = hasUrls
    ? `- Products may be names, Amazon/official URLs, or both. If a fetched page is included, use it as the primary source and cite that URL. If a fetch failed, web_search the name or Amazon ASIN. Never use a raw URL as the display name — use the real product name from the page.`
    : `- Prefer official spec pages, major retailers, and reputable reviews.`;
  const extraFetches = hasUrls ? 2 : 3;
  return `You are a shopping research agent. Compare consumer products using tools, then return a sourced decision table.

Rules:
- Use web_search and fetch_page. Do not invent prices or specs.
- If a fact is missing, write "unknown" and skip a fake source.
- ${urlRule}
- 2–4 products. Columns should be comparable (price, key specs, who it's for, notable cons).
- Prices: include currency and note they may be stale.
- Keep the loop short for a live demo: call several tools in the SAME turn, at most 2 searches and ${extraFetches} extra page fetches total, then return JSON.
- For each comparison column, pick exactly one winner: the product that is best on that dimension given the shopper's preference. If a column is unknown or a true tie, omit it from wins.
- JSON products[] and pick.name must be human product names, never URLs.
- ${lang}
- When ready, output ONLY JSON (no markdown) matching:
{
  "products": ["A","B"],
  "columns": ["Price","Weight", "..."],
  "cells": {
    "A": { "Price": { "text": "$348", "source": "https://..." } }
  },
  "wins": { "Price": "A", "Weight": "B" },
  "pick": { "name": "A", "reason": "one short sentence tied to the user's preference" }
}`;
}

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'web_search',
        description: 'Search the public web. Use for product names, official pages, reviews, and current prices.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Search query' },
          },
          required: ['query'],
        },
      },
      {
        name: 'fetch_page',
        description:
          'Fetch a public https page and return cleaned text. Use for Amazon listings, official product pages, and sources found via search.',
        parameters: {
          type: 'OBJECT',
          properties: {
            url: { type: 'STRING', description: 'Full https URL' },
          },
          required: ['url'],
        },
      },
    ],
  },
];

type Part = {
  text?: string;
  thought?: boolean;
  functionCall?: { name?: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
};

type Content = { role: string; parts: Part[] };

type GeminiResponse = {
  error?: { message?: string };
  candidates?: Array<{ content?: { parts?: Part[] } }>;
};

function parseResult(raw: string): CompareResult {
  const trimmed = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Model did not return a comparison table.');
  const data = JSON.parse(trimmed.slice(start, end + 1)) as CompareResult;
  if (!Array.isArray(data.products) || !Array.isArray(data.columns) || !data.cells || !data.pick) {
    throw new Error('Incomplete comparison JSON.');
  }
  if (!data.wins || typeof data.wins !== 'object' || Array.isArray(data.wins)) {
    data.wins = {};
  }
  return data;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function quotaRetryMs(message: string): number | null {
  if (!/quota|rate.?limit|429|resource has been exhausted/i.test(message)) return null;
  const match = message.match(/retry in ([0-9.]+)\s*s/i);
  const seconds = match ? Number(match[1]) : 8;
  return Math.min(Math.ceil(seconds * 1000) + 400, 20_000);
}

async function geminiTurn(
  apiKey: string,
  contents: Content[],
  onEvent: (e: AgentEvent) => void,
  locale: Locale,
  hasUrls: boolean
): Promise<Part[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const t = copy[locale];
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt(locale, hasUrls) }] },
    contents,
    tools: TOOLS,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingLevel: 'low' },
    },
  });

  let lastError = 'Gemini request failed';
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const json = (await res.json()) as GeminiResponse;
    if (res.ok && !json.error?.message) {
      return json.candidates?.[0]?.content?.parts || [];
    }

    lastError = json.error?.message || `Gemini HTTP ${res.status}`;
    const waitMs = quotaRetryMs(lastError);
    if (waitMs == null || attempt === 2) break;
    onEvent({
      type: 'status',
      text: t.quotaPause(Math.ceil(waitMs / 1000)),
    });
    await sleep(waitMs);
  }
  throw new Error(lastError);
}

function formatProductBlock(index: number, item: ProductInput, page?: string) {
  const lines = [`Product ${index}:`];
  if (item.name) lines.push(`- Name: ${item.name}`);
  if (item.url) {
    lines.push(`- URL: ${item.url}`);
    const asin = amazonAsin(item.url);
    if (asin) lines.push(`- Amazon ASIN: ${asin}`);
    if (page) {
      lines.push('- Fetched page (primary source — cite this URL):');
      lines.push(page.slice(0, 2800));
    }
  }
  return lines.join('\n');
}

async function prefetchProductPages(
  items: ProductInput[],
  onEvent: (e: AgentEvent) => void
) {
  const pages = new Map<string, string>();
  const withUrls = items.filter((item) => item.url);
  await Promise.all(
    withUrls.map(async (item) => {
      const url = item.url!;
      onEvent({ type: 'tool', name: 'fetch_page', input: url });
      try {
        pages.set(url, await fetchPage(url));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fetch failed';
        pages.set(url, `Tool error: ${message}`);
      }
    })
  );
  return pages;
}

export async function runCompareAgent(opts: {
  apiKey: string;
  query?: string;
  products?: string[];
  preference?: string;
  locale?: Locale;
  onEvent: (e: AgentEvent) => void;
}) {
  const { apiKey, preference, onEvent } = opts;
  const locale: Locale = opts.locale === 'zh' ? 'zh' : 'en';
  const t = copy[locale];
  const rawProducts =
    opts.products?.map((p) => p.trim()).filter(Boolean) ??
    (opts.query
      ? opts.query
          .split(/\s+vs\s+|\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []);
  const items = parseProductList(rawProducts);
  const hasUrls = items.some((item) => Boolean(item.url));

  let pages = new Map<string, string>();
  if (hasUrls) {
    onEvent({ type: 'status', text: t.readingPages });
    pages = await prefetchProductPages(items, onEvent);
  }

  const productBlock = items
    .map((item, i) => formatProductBlock(i + 1, item, item.url ? pages.get(item.url) : undefined))
    .join('\n\n');

  const user = [
    `Compare these products:\n\n${productBlock}`,
    preference?.trim()
      ? `Shopper preference: ${preference.trim()}`
      : 'No extra preference. Recommend the best overall value.',
    hasUrls
      ? 'Pages for pasted URLs are already fetched. Search only for name-only products or missing facts, then return the JSON table.'
      : 'Research with a short tool loop, then return the JSON table.',
  ].join('\n\n');

  const contents: Content[] = [{ role: 'user', parts: [{ text: user }] }];
  onEvent({ type: 'status', text: t.planning });

  for (let round = 0; round < 5; round++) {
    const parts = await geminiTurn(apiKey, contents, onEvent, locale, hasUrls);
    const calls = parts.filter((p) => p.functionCall?.name);
    const text = parts
      .filter((p) => p.text && !p.thought)
      .map((p) => p.text || '')
      .join('\n')
      .trim();

    if (calls.length === 0) {
      onEvent({ type: 'status', text: t.buildingTable });
      onEvent({ type: 'result', data: parseResult(text) });
      return;
    }

    contents.push({ role: 'model', parts });
    const toolParts = await Promise.all(
      calls.map(async (part) => {
        const name = part.functionCall!.name as string;
        const args = (part.functionCall!.args || {}) as Record<string, unknown>;
        const input = String(args.query || args.url || JSON.stringify(args));
        onEvent({ type: 'tool', name, input });
        const result = await runTool(name, args);
        return {
          functionResponse: { name, response: { result: result.slice(0, 4000) } },
        };
      })
    );
    contents.push({ role: 'user', parts: toolParts });
  }

  throw new Error(t.tooManySteps);
}
