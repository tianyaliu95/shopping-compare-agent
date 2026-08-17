import type { Copy } from '@/lib/i18n';
import type { CompareCell, CompareResult } from '@/lib/types';
import { isPick } from './helpers';
import { SourceLink } from './SourceLink';

function CellBody({ cell, sourceLabel }: { cell?: CompareCell; sourceLabel: string }) {
  return (
    <>
      <p className="leading-relaxed">{cell?.text || '—'}</p>
      {cell?.source && <SourceLink href={cell.source} label={sourceLabel} />}
    </>
  );
}

export function DecisionTable({ result, t }: { result: CompareResult; t: Copy }) {
  return (
    <>
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
                    <div className="mt-1.5 text-sm text-ink">
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
    </>
  );
}
