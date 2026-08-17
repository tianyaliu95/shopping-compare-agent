import { forwardRef } from 'react';
import type { Copy } from '@/lib/i18n';
import type { CompareResult } from '@/lib/types';
import { DecisionTable } from './DecisionTable';
import { WinMatrix } from './WinMatrix';

export const ResultSection = forwardRef<HTMLElement, { result: CompareResult; t: Copy }>(
  function ResultSection({ result, t }, ref) {
    return (
      <section ref={ref} className="reveal mt-12 scroll-mt-6 sm:mt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">{t.recommendation}</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {result.pick.name}
        </h2>
        <p className="mt-3 max-w-2xl border-l-[3px] border-mark pl-4 text-sm leading-relaxed text-ink-muted sm:pl-5 sm:text-base">
          {result.pick.reason}
        </p>

        <WinMatrix result={result} t={t} />
        <DecisionTable result={result} t={t} />
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-faint">{t.caveat}</p>
      </section>
    );
  }
);
