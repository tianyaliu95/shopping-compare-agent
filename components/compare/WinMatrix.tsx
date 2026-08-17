import type { Copy } from '@/lib/i18n';
import type { CompareResult } from '@/lib/types';
import { isPick } from './helpers';

export function WinMatrix({ result, t }: { result: CompareResult; t: Copy }) {
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
