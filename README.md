# Shop Compare

A **multi-step shopping research agent**: you name 2–4 products, it plans comparison criteria, uses search/fetch tools, and returns a **sourced decision table**.

Not a chatbot that hallucinates a spreadsheet — the UI shows the plan–act–observe loop.

## Try locally

```bash
cp .env.example .env
# add GEMINI_API_KEY
npm install
npm run dev
```

Open http://localhost:3000 — start with the Headphones example.

## What it does

1. **Plan** comparison dimensions from the products + your preference
2. **Act** with `web_search` and `fetch_page`
3. **Observe** public specs / prices / reviews
4. **Decide** a table + a pick tied to what you said you care about

## Stack

Next.js 14 · TypeScript · Gemini function calling · SSE · Vercel-ready
