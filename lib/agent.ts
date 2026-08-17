import { runTool } from './tools';
import type { AgentEvent, CompareResult } from './types';

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest';

const SYSTEM = `You are a shopping research agent. Compare consumer products using tools, then return a sourced decision table.

Rules:
- Use web_search and fetch_page. Do not invent prices or specs.
- If a fact is missing, write "unknown" and skip a fake source.
- Prefer official spec pages, major retailers, and reputable reviews.
- 2–4 products. Columns should be comparable (price, key specs, who it's for, notable cons).
- Prices: include currency and note they may be stale.
- When ready, output ONLY JSON (no markdown) matching:
{
  "products": ["A","B"],
  "columns": ["Price","Weight", "..."],
  "cells": {
    "A": { "Price": { "text": "$348", "source": "https://..." } }
  },
  "pick": { "name": "A", "reason": "one short sentence tied to the user's preference" },
  "caveat": "Prices/specs can change; verify before buying."
}`;

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
        description: 'Fetch a public https page and return cleaned text. Use after search to read a specific source.',
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
  return data;
}

async function geminiTurn(apiKey: string, contents: Content[]): Promise<Part[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents,
      tools: TOOLS,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    }),
  });
  const json = (await res.json()) as GeminiResponse;
  if (!res.ok || json.error?.message) {
    throw new Error(json.error?.message || `Gemini HTTP ${res.status}`);
  }
  return json.candidates?.[0]?.content?.parts || [];
}

export async function runCompareAgent(
  opts: { apiKey: string; query: string; preference?: string; onEvent: (e: AgentEvent) => void }
) {
  const { apiKey, query, preference, onEvent } = opts;
  const user = [
    `Compare these products:\n${query.trim()}`,
    preference?.trim() ? `Shopper preference: ${preference.trim()}` : 'No extra preference. Recommend the best overall value.',
    'Research with tools, then return the JSON table.',
  ].join('\n\n');

  const contents: Content[] = [{ role: 'user', parts: [{ text: user }] }];
  onEvent({ type: 'status', text: 'Planning comparison dimensions…' });

  for (let round = 0; round < 8; round++) {
    const parts = await geminiTurn(apiKey, contents);
    const calls = parts.filter((p) => p.functionCall?.name);
    const text = parts
      .filter((p) => p.text && !p.thought)
      .map((p) => p.text || '')
      .join('\n')
      .trim();

    if (calls.length === 0) {
      onEvent({ type: 'status', text: 'Building the decision table…' });
      onEvent({ type: 'result', data: parseResult(text) });
      return;
    }

    contents.push({ role: 'model', parts });
    const toolParts: Part[] = [];
    for (const part of calls) {
      const name = part.functionCall!.name as string;
      const args = (part.functionCall!.args || {}) as Record<string, unknown>;
      const input = String(args.query || args.url || JSON.stringify(args));
      onEvent({ type: 'tool', name, input });
      const result = await runTool(name, args);
      toolParts.push({
        functionResponse: { name, response: { result: result.slice(0, 6000) } },
      });
    }
    contents.push({ role: 'user', parts: toolParts });
  }

  throw new Error('Agent stopped after too many tool steps. Try fewer products.');
}
