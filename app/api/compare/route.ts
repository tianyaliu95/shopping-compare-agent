import { runCompareAgent } from '@/lib/agent';
import { copy, type Locale } from '@/lib/i18n';
import type { AgentEvent } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 90;

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

  if (!apiKey) {
    return Response.json({ error: t.missingKey }, { status: 503 });
  }

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await runCompareAgent({
          apiKey,
          products,
          preference,
          locale,
          onEvent: send,
        });
      } catch (err) {
        send({
          type: 'error',
          message: err instanceof Error ? err.message : t.compareFailed,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
