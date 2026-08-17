import { runCompareAgent } from '@/lib/agent';
import type { AgentEvent } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: 'Set GEMINI_API_KEY on the server.' }, { status: 503 });
  }

  let body: { query?: string; preference?: string };
  try {
    body = (await req.json()) as { query?: string; preference?: string };
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 800) : '';
  const preference =
    typeof body.preference === 'string' ? body.preference.trim().slice(0, 240) : '';
  if (query.length < 3) {
    return Response.json({ error: 'Describe 2–4 products to compare.' }, { status: 400 });
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
          query,
          preference,
          onEvent: send,
        });
      } catch (err) {
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Compare failed',
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
