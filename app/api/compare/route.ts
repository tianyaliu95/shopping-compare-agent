import { runCompareAgent } from '@/lib/agent';
import { copy, type Locale } from '@/lib/i18n';
import { checkRateLimit, clientIp } from '@/lib/rateLimit';
import { readCachedRun, runKey, writeCachedRun } from '@/lib/resultCache';
import { findSeed } from '@/lib/seeds';
import type { AgentEvent } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 90;

const REPLAY_STEP_MS = 160;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  };
}

async function replay(
  events: AgentEvent[],
  send: (event: AgentEvent) => void,
  t: (typeof copy)['en'],
  intro: string
) {
  send({ type: 'status', text: intro });
  for (const event of events) {
    if (event.type !== 'tool') continue;
    await sleep(REPLAY_STEP_MS);
    send(event);
  }
  await sleep(REPLAY_STEP_MS);
  send({ type: 'status', text: t.buildingTable });
  const result = events.find((event) => event.type === 'result');
  if (result) send(result);
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  let body: { query?: string; products?: unknown; preference?: string; locale?: string };
  try {
    body = (await req.json()) as {
      query?: string;
      products?: unknown;
      preference?: string;
      locale?: string;
    };
  } catch {
    return Response.json({ error: copy.en.invalidJson }, { status: 400 });
  }

  const locale: Locale = body.locale === 'zh' ? 'zh' : 'en';
  const t = copy[locale];

  const products = Array.isArray(body.products)
    ? body.products
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().slice(0, 1000))
        .filter(Boolean)
        .slice(0, 4)
    : typeof body.query === 'string'
      ? body.query
          .split(/\s+vs\s+|\n/)
          .map((item) => item.trim().slice(0, 1000))
          .filter(Boolean)
          .slice(0, 4)
      : [];
  const preference =
    typeof body.preference === 'string' ? body.preference.trim().slice(0, 600) : '';
  if (products.length < 2) {
    return Response.json({ error: t.needProducts }, { status: 400 });
  }

  const key = runKey(locale, products, preference);
  const cached = readCachedRun(key);
  const seed = findSeed(locale, products, preference);
  const encoder = new TextEncoder();

  const streamOf = (start: (send: (event: AgentEvent) => void) => Promise<void>) =>
    new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: AgentEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };
        try {
          await start(send);
        } finally {
          controller.close();
        }
      },
    });

  if (cached) {
    return new Response(
      streamOf((send) => replay(cached, send, t, t.cachedRun)),
      { headers: sseHeaders() }
    );
  }

  if (!apiKey) {
    if (seed) {
      return new Response(
        streamOf((send) => replay(seed.events, send, t, t.planning)),
        { headers: sseHeaders() }
      );
    }
    return Response.json({ error: t.missingKey }, { status: 503 });
  }

  const verdict = checkRateLimit(clientIp(req));
  if (!verdict.ok) {
    if (seed) {
      return new Response(
        streamOf((send) => replay(seed.events, send, t, t.planning)),
        { headers: sseHeaders() }
      );
    }
    return Response.json(
      { error: t.rateLimited(Math.max(1, Math.ceil(verdict.retryAfterSec / 60))) },
      { status: 429, headers: { 'Retry-After': String(verdict.retryAfterSec) } }
    );
  }

  return new Response(
    streamOf(async (send) => {
      const recorded: AgentEvent[] = [];
      const record = (event: AgentEvent) => {
        if (event.type === 'tool' || event.type === 'result') recorded.push(event);
        send(event);
      };

      try {
        await runCompareAgent({ apiKey, products, preference, locale, onEvent: record });
        writeCachedRun(key, recorded);
      } catch (err) {
        const failedBeforeResult = !recorded.some((event) => event.type === 'result');
        if (failedBeforeResult && seed) {
          await replay(seed.events, send, t, t.buildingTable);
          return;
        }
        send({
          type: 'error',
          message: err instanceof Error ? err.message : t.compareFailed,
        });
      }
    }),
    { headers: sseHeaders() }
  );
}
