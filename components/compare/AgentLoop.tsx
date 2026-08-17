import type { Copy } from '@/lib/i18n';
import type { AgentStep } from '@/lib/types';

export function AgentLoop({
  t,
  status,
  steps,
  busy,
}: {
  t: Copy;
  status: string | null;
  steps: AgentStep[];
  busy: boolean;
}) {
  if (!status && steps.length === 0) return null;

  return (
    <section className="relative mt-12 scroll-mt-6 sm:mt-16" aria-live="polite" aria-busy={busy}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t.agentLoop}</h2>
        {status && (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            {busy && <span className="live-dot inline-block size-1.5 rounded-[1px] bg-pine" aria-hidden />}
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
    </section>
  );
}
