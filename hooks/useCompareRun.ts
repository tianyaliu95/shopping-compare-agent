import { useState } from 'react';
import type { Copy, Locale } from '@/lib/i18n';
import type { AgentEvent, AgentStep, CompareResult } from '@/lib/types';

function parseSseEvents(buffer: string): { events: AgentEvent[]; rest: string } {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  const events: AgentEvent[] = [];
  for (const block of parts) {
    const line = block
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('data:'));
    if (!line) continue;
    events.push(JSON.parse(line.slice(5).trim()) as AgentEvent);
  }
  return { events, rest };
}

export function useCompareRun(t: Copy) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(input: { products: string[]; preference: string; locale: Locale }) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setSteps([]);
    setStatus(t.starting);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok || !res.body) {
        let message = t.compareFailed;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSseEvents(buffer);
        buffer = rest;

        for (const event of events) {
          if (event.type === 'status') setStatus(event.text);
          if (event.type === 'tool') {
            setSteps((prev) => [
              ...prev,
              { id: `${Date.now()}-${prev.length}`, name: event.name, input: event.input },
            ]);
          }
          if (event.type === 'result') {
            setResult(event.data);
            setStatus(t.done);
          }
          if (event.type === 'error') throw new Error(event.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.compareFailed);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return { busy, status, steps, result, error, run };
}
