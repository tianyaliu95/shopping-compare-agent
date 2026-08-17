'use client';

import { useEffect, useRef, useState } from 'react';
import type { AgentEvent, CompareCell, CompareResult } from '@/lib/types';
import { copy, detectLocale, STORAGE_KEY, TYPE_EXAMPLES, type Locale } from '@/lib/i18n';

const MIN_PRODUCTS = 2;
const MAX_PRODUCTS = 4;

type Step = { id: string; name: string; input: string };

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 inline-block min-h-11 py-1 text-xs font-medium text-pine underline decoration-pine/30 underline-offset-4 hover:decoration-pine sm:min-h-0 sm:py-0"
    >
      {label}
    </a>
  );
}

function CellBody({ cell, sourceLabel }: { cell?: CompareCell; sourceLabel: string }) {
  return (
    <>
      <p className="leading-relaxed">{cell?.text || '—'}</p>
      {cell?.source && <SourceLink href={cell.source} label={sourceLabel} />}
    </>
  );
}

function isPick(product: string, pickName: string) {
  const a = product.toLowerCase();
  const b = pickName.toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

function WinMatrix({ result, t }: { result: CompareResult; t: (typeof copy)['en'] }) {
  const wins = result.wins ?? {};
  const rows = result.columns.filter((col) => wins[col]);
  if (rows.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t.whoWins}</h3>
      <p className="mt-1 text-sm text-ink-faint">{t.whoWinsHint}</p>

      <ul className="mt-4 divide-y divide-line rounded-3xl border border-line bg-white/55 md:hidden">
        {rows.map((col) => (
          <li key={col} className="flex items-baseline justify-between gap-4 px-4 py-3.5">
            <span className="text-sm text-ink-muted">{col}</span>
            <span className="text-right text-sm font-semibold text-ink">{wins[col]}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 hidden overflow-hidden rounded-3xl border border-line bg-white/55 md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="w-[8.5rem] px-4 py-3 text-left font-medium text-ink-faint"> </th>
              {result.products.map((p) => (
                <th key={p} className="px-3 py-3 text-center font-semibold leading-snug text-ink">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((col) => (
              <tr key={col} className="border-b border-line/80 last:border-b-0">
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-ink-muted">{col}</th>
                {result.products.map((p) => {
                  const won = isPick(p, wins[col]);
                  return (
                    <td key={`${p}-${col}`} className={`px-3 py-3 text-center ${won ? 'bg-mark/35' : ''}`}>
                      {won ? (
                        <svg
                          viewBox="0 0 20 20"
                          className="mx-auto size-5 text-pine"
                          fill="none"
                          aria-label={t.win}
                        >
                          <path
                            d="M4.5 10.5 8 14l7.5-8"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <span className="text-ink-faint">–</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CompareApp() {
  const [locale, setLocale] = useState<Locale>('en');
  const [products, setProducts] = useState(['', '', '']);
  const [preference, setPreference] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loopRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const autoScrolling = useRef(false);

  const filled = products.map((p) => p.trim()).filter(Boolean);
  const query = filled.join(' vs ');
  const t = copy[locale];
  const types = TYPE_EXAMPLES[locale];

  useEffect(() => {
    const next = detectLocale();
    setLocale(next);
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  }, []);

  function switchLocale(next: Locale) {
    const currentType = TYPE_EXAMPLES[locale].find(
      (item) =>
        products.length === item.products.length &&
        products.every((p, i) => p === item.products[i]) &&
        preference === item.preference
    );
    setLocale(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    if (currentType) {
      const mapped = TYPE_EXAMPLES[next].find((item) => item.id === currentType.id);
      if (mapped) {
        setProducts([...mapped.products]);
        setPreference(mapped.preference);
      }
    }
  }

  useEffect(() => {
    function onScroll() {
      if (autoScrolling.current) return;
      const remaining =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      followRef.current = remaining < 180;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!busy && !status && steps.length === 0 && !result && !error) return;
    if (!result && !followRef.current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    autoScrolling.current = true;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (result) {
          resultRef.current?.scrollIntoView({
            behavior: reduce ? 'auto' : 'smooth',
            block: 'start',
          });
        } else {
          endRef.current?.scrollIntoView({
            behavior: reduce ? 'auto' : 'smooth',
            block: 'end',
          });
        }
        window.setTimeout(() => {
          autoScrolling.current = false;
        }, reduce ? 50 : 450);
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [busy, status, steps, result, error]);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setSteps([]);
    setStatus(t.starting);
    followRef.current = true;

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, preference, locale }),
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

  return (
    <div className="page-shell mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 lg:px-8">
      {busy && (
        <div className="fixed inset-x-0 top-0 z-30 h-0.5 overflow-hidden bg-pine/15" aria-hidden>
          <div className="progress-bar h-full w-full bg-pine" />
        </div>
      )}

      <header className="rise relative pb-2">
        <div className="relative z-10 flex justify-end">
          <div className="flex items-center gap-1.5 text-sm">
            <button
              type="button"
              onClick={() => switchLocale('en')}
              className={locale === 'en' ? 'font-semibold text-ink' : 'text-ink-faint hover:text-ink'}
            >
              EN
            </button>
            <span className="text-ink-faint">/</span>
            <button
              type="button"
              onClick={() => switchLocale('zh')}
              className={locale === 'zh' ? 'font-semibold text-ink' : 'text-ink-faint hover:text-ink'}
            >
              中文
            </button>
          </div>
        </div>
        <div className="vs-mark" aria-hidden>
          vs
        </div>
        <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-pine">
          {t.kicker}
        </p>
        <h1 className="relative mt-3 max-w-[14ch] font-display text-[2.5rem] font-extrabold leading-[1.06] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.25rem]">
          {t.titleLine1}
          <span className="block">{t.titleLine2}</span>
        </h1>
        <p className="relative mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-muted sm:mt-5 sm:text-lg">
          {t.subtitle}
        </p>
      </header>

      <section className="rise-delay relative mt-8 sm:mt-10" aria-label={t.startAComparison}>
        <form
          className="relative max-w-3xl lg:max-w-4xl"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">{t.tryAType}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {types.map((item) => {
              const selected =
                products.length === item.products.length &&
                products.every((p, i) => p === item.products[i]) &&
                preference === item.preference;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setProducts([...item.products]);
                    setPreference(item.preference);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? 'bg-pine text-paper-2'
                      : 'bg-white/55 text-ink-muted hover:bg-white/90 hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setProducts(['', '', '']);
                setPreference('');
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filled.length === 0 && preference.trim() === ''
                  ? 'bg-pine text-paper-2'
                  : 'bg-white/55 text-ink-muted hover:bg-white/90 hover:text-ink'
              }`}
            >
              {t.yourOwn}
            </button>
          </div>

          <div className="mt-8">
            <div className="grid lg:grid-cols-[26.5rem_minmax(0,1fr)] lg:items-stretch lg:gap-x-8">
              <div className="flex flex-col">
                <div className="flex min-h-5 items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{t.products}</p>
                  <p className="text-xs text-ink-faint">{t.ofMax(filled.length, MAX_PRODUCTS)}</p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {products.map((name, i) => (
                    <li key={i} className="relative">
                      <input
                        value={name}
                        onChange={(e) => {
                          const next = [...products];
                          next[i] = e.target.value;
                          setProducts(next);
                        }}
                        autoComplete="off"
                        placeholder={t.productPlaceholder(i + 1)}
                        className="field min-h-12 pr-12"
                      />
                      <button
                        type="button"
                        aria-label={t.removeProduct}
                        disabled={products.length <= MIN_PRODUCTS}
                        onClick={() => {
                          if (products.length <= MIN_PRODUCTS) return;
                          setProducts(products.filter((_, idx) => idx !== i));
                        }}
                        className="icon-btn absolute right-1.5 top-1/2 -translate-y-1/2"
                      >
                        −
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={products.length >= MAX_PRODUCTS}
                  onClick={() => {
                    if (products.length >= MAX_PRODUCTS) return;
                    setProducts([...products, '']);
                  }}
                  className="mt-3 self-start text-sm font-medium text-pine transition hover:text-pine-deep disabled:opacity-30 lg:hidden"
                >
                  {t.addProduct}
                </button>
              </div>

              <div className="mt-8 flex min-h-0 flex-col lg:mt-0">
                <label htmlFor="preference-field" className="flex min-h-5 items-center text-sm font-medium text-ink">
                  {t.whatMatters}
                </label>
                <textarea
                  id="preference-field"
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  autoComplete="off"
                  placeholder={t.whatMattersPlaceholder}
                  className="field mt-3 min-h-[7.5rem] flex-1 resize-none lg:min-h-0"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={products.length >= MAX_PRODUCTS}
              onClick={() => {
                if (products.length >= MAX_PRODUCTS) return;
                setProducts([...products, '']);
              }}
              className="mt-3 hidden text-sm font-medium text-pine transition hover:text-pine-deep disabled:opacity-30 lg:inline-block"
            >
              {t.addProduct}
            </button>
          </div>

          <button
            type="submit"
            disabled={busy || filled.length < MIN_PRODUCTS}
            className="mt-8 min-h-12 w-full rounded-2xl bg-pine px-8 text-sm font-semibold tracking-wide text-paper-2 transition hover:bg-pine-deep disabled:opacity-45 sm:w-auto sm:min-w-[10.5rem]"
          >
            {busy ? t.researching : t.compare}
          </button>
        </form>
      </section>

      <section
        ref={loopRef}
        className="relative mt-12 scroll-mt-6 sm:mt-16"
        aria-live="polite"
        aria-busy={busy}
      >
        {(status || steps.length > 0) && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {t.agentLoop}
              </h2>
              {status && (
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  {busy && (
                    <span className="live-dot inline-block size-1.5 rounded-[1px] bg-pine" aria-hidden />
                  )}
                  {status}
                </p>
              )}
            </div>

            <ol className="mt-5 max-w-3xl border-l border-line">
              {steps.map((step, i) => (
                <li key={step.id} className="step-in relative py-3 pl-5 sm:py-3.5 sm:pl-6">
                  <span className="absolute -left-1 top-5 size-2 bg-pine" aria-hidden />
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-pine">
                    {String(i + 1).padStart(2, '0')} · {step.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{step.input}</p>
                </li>
              ))}
              {busy && steps.length === 0 && (
                <li className="py-3 pl-5 text-sm text-ink-muted sm:pl-6">{t.planning}</li>
              )}
            </ol>
          </>
        )}
      </section>

      {error && (
        <p className="reveal mt-8 border-l-2 border-red-700 pl-4 text-sm leading-relaxed text-red-800" role="alert">
          {error}
        </p>
      )}

      {result && (
        <section ref={resultRef} className="reveal mt-12 scroll-mt-6 sm:mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">{t.recommendation}</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {result.pick.name}
          </h2>
          <p className="mt-3 max-w-2xl border-l-[3px] border-mark pl-4 text-sm leading-relaxed text-ink-muted sm:pl-5 sm:text-base">
            {result.pick.reason}
          </p>

          <WinMatrix result={result} t={t} />

          <div className="mt-10 flex items-end justify-between gap-4">
            <h3 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {t.decisionTable}
            </h3>
            <p className="hidden text-sm text-ink-faint md:block">{t.eachCellSourced}</p>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {result.columns.map((col) => (
              <div key={col} className="rounded-3xl border border-line bg-white/55 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">{col}</p>
                <ul className="mt-3 divide-y divide-line">
                  {result.products.map((p) => {
                    const picked = isPick(p, result.pick.name);
                    const cell = result.cells[p]?.[col];
                    return (
                      <li key={p} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">{p}</p>
                          {picked && (
                            <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-pine">
                              {t.pick}
                            </span>
                          )}
                        </div>
                        <div className={`mt-1.5 text-sm text-ink ${picked ? '' : 'text-ink'}`}>
                          <CellBody cell={cell} sourceLabel={t.source} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 hidden overflow-hidden rounded-3xl border border-line bg-white/55 md:block">
            <div className="table-scroll" tabIndex={0} aria-label={t.comparisonTable}>
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="sticky-col sticky-col-head min-w-[7.25rem] py-3 pl-4 pr-3 font-medium text-ink-faint">
                      {t.spec}
                    </th>
                    {result.products.map((p) => {
                      const picked = isPick(p, result.pick.name);
                      return (
                        <th
                          key={p}
                          className={`min-w-[11rem] px-4 py-3 font-semibold leading-snug sm:min-w-[13rem] ${
                            picked ? 'bg-mark/35 text-ink' : 'text-ink'
                          }`}
                        >
                          {p}
                          {picked && (
                            <span className="mt-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-pine">
                              {t.pick}
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {result.columns.map((col) => (
                    <tr key={col} className="border-b border-line/80 align-top last:border-b-0">
                      <th className="sticky-col whitespace-nowrap py-3.5 pl-4 pr-3 text-left font-medium text-ink-muted">
                        {col}
                      </th>
                      {result.products.map((p) => {
                        const cell = result.cells[p]?.[col];
                        const picked = isPick(p, result.pick.name);
                        return (
                          <td
                            key={`${p}-${col}`}
                            className={`px-4 py-3.5 text-ink ${picked ? 'bg-mark/20' : ''}`}
                          >
                            <p className="max-w-[16rem] leading-relaxed">{cell?.text || '—'}</p>
                            {cell?.source && <SourceLink href={cell.source} label={t.source} />}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-faint">{result.caveat}</p>
        </section>
      )}
      <div ref={endRef} className="h-px" aria-hidden />
    </div>
  );
}
