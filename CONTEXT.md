# Shop Compare Agent — handoff

Moved from Fitness Pilot chat. Goal: a **shopping product comparison agent** (resume: multi-step research agent with tools).

## Product

User pastes 2–4 product names (or later URLs) → agent **plans dimensions → search/fetch public pages → table + recommendation + sources**.

Demo story: `Sony WH-1000XM5 vs Bose QC Ultra vs AirPods Max`, budget ~$400, prioritize ANC.

MVP category: **headphones / consumer electronics**. Not a full price engine, no checkout, no logged-in scraping.

## Agent loop

1. Plan: detect category + 6–8 comparison columns
2. Act: `web_search` + `fetch_page`
3. Observe: extract price, specs, sentiment
4. Decide: sourced table + “if you care about X pick A”
5. Optional refine: user says “more on battery” → another loop

UI must show a **step timeline** (searching… reading…) so it looks like an agent, not a chatbot.

## Stack

- Next.js App Router + TypeScript + Tailwind (same as Fitness Pilot)
- Gemini function calling + SSE streaming
- Vercel + `GEMINI_API_KEY` (server only)
- Tools: search + fetch HTML text; fail closed with “source insufficient” instead of inventing prices

## Out of scope (v1)

Affiliate checkout, inventory monitors, browser extension, crawling behind login.

## Resume line

Built a shopping research agent that plans comparison criteria, uses search/fetch tools in a plan–act–observe loop, and returns a sourced decision table.
