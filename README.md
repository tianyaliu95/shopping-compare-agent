<h1>Shopping Compare Agent</h1>

<p>
  A tool-using AI agent that researches products on the live web and returns a <b>sourced decision table</b>.
</p>

<p>
  <a href="https://shopping-compare-agent.vercel.app"><img alt="Live demo" src="https://img.shields.io/badge/live%20demo-online-1a5c45" /></a>
  <img alt="Next.js 14" src="https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-function%20calling-1a5c45" />
  <img alt="SSE" src="https://img.shields.io/badge/streaming-SSE-1a5c45" />
</p>

**Try it → [shopping-compare-agent.vercel.app](https://shopping-compare-agent.vercel.app)**

---

## Overview

Give it 2–4 products and what you care about. The agent plans its own comparison criteria, searches the public web, reads the pages it finds, and answers with a table where **every cell links to its source** — plus a single recommendation tied to your stated preference.

It is an agent, not a prompt wrapper: the model decides which tools to call and when to stop, and the UI streams that loop as it happens.

```
Products + preference  →  plan criteria  →  search / fetch  →  observe  →  decide
                              ↑______________________________________|
                                        (up to 5 rounds)
```

## Features

- **Real tool use** — Gemini function calling over `web_search` and `fetch_page`, multiple calls per turn, executed in parallel
- **Transparent loop** — every status change and tool call is streamed to the UI over Server-Sent Events
- **Cited results** — each table cell carries a source URL; unverifiable facts must come back as `unknown`
- **Paste names or links** — Amazon and official product URLs are canonicalized and prefetched before the model runs
- **Per-criterion winners** — a "who wins" matrix on top of the detail table, plus one overall pick
- **Bilingual** — EN / 中文 UI, with the locale passed to the model so column names and reasoning match
- **Free-tier friendly** — capped rounds, parallel calls, and 429 backoff that reads Gemini's own retry hint
- **Degrades instead of breaking** — rate limits protect the shared quota, recent runs are cached and replayed, and each example ships with a recorded real run as a fallback

## Architecture

```
   Products + preference
             │
             ▼
   POST /api/compare ─────────── SSE events ──────────►  Agent Loop panel
             │                                              (live UI)
             ├─ URLs pasted ──►  prefetch pages in parallel
             │                              │
             └─ names only ─────────────────┤
                                            ▼
                              ┌──────  Agent loop  ──────┐
                              │      (up to 5 rounds)    │
                     function │                          │ tool
                        calls ▼                          ▲ results
                        web_search  ·  fetch_page ───────┘
                                            │
                                            │ no more calls
                                            ▼
                    Strict JSON: columns · sourced cells · wins · pick
```

| Stage | Responsibility | File |
| --- | --- | --- |
| Parse | Name vs URL detection, Amazon `/dp/<ASIN>` canonicalization | `lib/productInput.ts` |
| Prefetch | Fetch pasted pages in parallel before inference | `lib/agent.ts` |
| Loop | Prompt, tool schema, round cap, quota retries | `lib/agent.ts` |
| Tools | DuckDuckGo HTML search, page fetch via r.jina.ai with direct fallback | `lib/tools.ts` |
| Transport | Request validation and SSE stream | `app/api/compare/route.ts` |
| Client | SSE parsing and agent state | `hooks/useCompareRun.ts` |

## Agent design

**Tools exposed to the model**

| Tool | Args | Returns |
| --- | --- | --- |
| `web_search` | `query: string` | Top 5 results as title / URL / snippet |
| `fetch_page` | `url: string` | Cleaned page text, capped at 8k chars |

**Output contract** — the run ends when the model stops calling tools and emits JSON only:

```json
{
  "products": ["A", "B"],
  "columns": ["Price", "Weight"],
  "cells": { "A": { "Price": { "text": "$348", "source": "https://..." } } },
  "wins": { "Price": "A", "Weight": "B" },
  "pick": { "name": "A", "reason": "one short sentence tied to the user's preference" }
}
```

**Guardrails**

- A source URL is required per cell; missing facts must be `unknown` rather than invented
- Product names in the output must be real names, never the pasted URL
- Round cap of 5 and a tool-result budget keep a demo run bounded
- `429` responses parse Gemini's `retry in Ns` hint and surface a localized pause instead of failing
- The API key stays server-side; the browser only ever receives SSE events
- The public endpoint is rate limited per IP and globally; when a live run is unavailable the example categories replay a recorded run instead of erroring

## Try it

**→ [shopping-compare-agent.vercel.app](https://shopping-compare-agent.vercel.app)**

Click a category chip for a pre-filled example, or paste your own product names and Amazon links, then watch the agent loop fill in while it researches.

## Project structure

```
app/
  api/compare/route.ts     validation + SSE stream
  layout.tsx  icon.svg     fonts, metadata, favicon
components/
  CompareApp.tsx           state + composition
  compare/                 Header, CompareForm, AgentLoop, ResultSection, …
hooks/
  useCompareRun.ts         SSE client + agent state
  useFollowScroll.ts       scroll choreography
lib/
  agent.ts                 prompt, tool schema, agent loop, retries
  tools.ts                 web_search + fetch_page
  productInput.ts          name vs URL parsing, Amazon canonicalization
  rateLimit.ts             per-IP + global request windows
  resultCache.ts           replayable recent runs
  seeds/                   recorded runs for the built-in examples
  i18n.ts                  EN / 中文 copy and examples
scripts/seed-examples.ts   regenerates lib/seeds/examples.json
```

## Roadmap

- [ ] Follow-up refinement ("ignore price, weight battery life higher")
- [ ] Shareable result URLs and export
- [ ] Recent comparisons kept locally
- [ ] Criterion weights in the input

---

Built by [Tianya Liu](https://www.tianyaliu.ca/).
