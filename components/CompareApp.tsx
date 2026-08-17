'use client';

import { useMemo, useState } from 'react';
import type { AgentEvent, CompareResult } from '@/lib/types';

const EXAMPLES = [
  {
    label: 'Headphones',
    query: 'Sony WH-1000XM5 vs Bose QuietComfort Ultra vs Apple AirPods Max',
    preference: 'Budget around $400, prioritize noise cancelling',
  },
  {
    label: 'Keyboards',
    query: 'Keychron Q1 Max vs Logitech MX Mechanical vs Nuphy Air75 V2',
    preference: 'Mostly laptop use, want quiet typing',
  },
  {
    label: 'Monitors',
    query: 'Dell U2723QE vs LG 27UP850 vs BenQ RD280U',
    preference: 'Coding all day, care about text clarity and USB-C',
  },
];

type Step = { id: string; name: string; input: string };

export function CompareApp() {
  const [query, setQuery] = useState(EXAMPLES[0].query);
  const [preference, setPreference] = useState(EXAMPLES[0].preference);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(() => result?.columns ?? [], [result]);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setSteps([]);
    setStatus('Starting agent…');

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, preference }),
      });

      if (!res.ok || !res.body) {
        let message = 'Compare failed';
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
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const block of parts) {
          const line = block
            .split('\n')
            .map((l) => l.trim())
            .find((l) => l.startsWith('data:'));
          if (!line) continue;
          const event = JSON.parse(line.slice(5).trim()) as AgentEvent;
          if (event.type === 'status') setStatus(event.text);
          if (event.type === 'tool') {
            setSteps((prev) => [
              ...prev,
              { id: `${Date.now()}-${prev.length}`, name: event.name, input: event.input },
            ]);
          }
          if (event.type === 'result') {
            setResult(event.data);
            setStatus('Done');
          }
          if (event.type === 'error') throw new Error(event.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compare failed');
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-medium tracking-wide text-amber-800">Research agent</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Shop Compare
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Drop in 2–4 products. The agent plans criteria, searches public pages, and returns a
          sourced table — not a generic chatbot dump.
        </p>
      </header>

      <section className="mt-8 rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setQuery(ex.query);
                setPreference(ex.preference);
              }}
              className="rounded-full border border-ink/10 bg-paper px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:border-ink/20 hover:text-ink"
            >
              {ex.label}
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm font-medium text-ink">
          Products
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-y rounded-2xl border border-ink/10 bg-paper px-3.5 py-3 text-sm text-ink outline-none ring-amber-700/20 focus:ring-2"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-ink">
          What matters to you
          <input
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-ink/10 bg-paper px-3.5 py-3 text-sm text-ink outline-none ring-amber-700/20 focus:ring-2"
          />
        </label>

        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || query.trim().length < 3}
          className="mt-5 rounded-2xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
        >
          {busy ? 'Researching…' : 'Compare'}
        </button>
      </section>

      {(status || steps.length > 0) && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Agent loop
          </h2>
          <ol className="mt-3 space-y-2">
            {steps.map((step) => (
              <li
                key={step.id}
                className="rounded-2xl border border-ink/8 bg-white/70 px-4 py-3 text-sm"
              >
                <span className="font-mono text-xs font-semibold text-amber-800">{step.name}</span>
                <p className="mt-1 truncate text-ink-muted">{step.input}</p>
              </li>
            ))}
          </ol>
          {status && <p className="mt-3 text-sm text-ink-muted">{status}</p>}
        </section>
      )}

      {error && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-10">
          <div className="rounded-3xl border border-amber-800/15 bg-amber-50/80 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Pick</p>
            <p className="mt-1 text-lg font-semibold text-ink">{result.pick.name}</p>
            <p className="mt-1 text-sm text-ink-muted">{result.pick.reason}</p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/10 bg-white shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 bg-paper">
                  <th className="px-4 py-3 font-semibold text-ink"> </th>
                  {result.products.map((p) => (
                    <th key={p} className="px-4 py-3 font-semibold text-ink">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {columns.map((col) => (
                  <tr key={col} className="border-b border-ink/5 align-top">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">{col}</th>
                    {result.products.map((p) => {
                      const cell = result.cells[p]?.[col];
                      return (
                        <td key={`${p}-${col}`} className="px-4 py-3 text-ink">
                          <p>{cell?.text || '—'}</p>
                          {cell?.source && (
                            <a
                              href={cell.source}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs text-amber-800 underline-offset-2 hover:underline"
                            >
                              source
                            </a>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-ink-faint">{result.caveat}</p>
        </section>
      )}
    </div>
  );
}
