import type { Copy, TypeExample } from '@/lib/i18n';
import { MAX_PRODUCTS, MIN_PRODUCTS } from './constants';
import { isTypeSelected } from './helpers';

export function CompareForm({
  t,
  types,
  products,
  preference,
  filled,
  busy,
  onProducts,
  onPreference,
  onSubmit,
}: {
  t: Copy;
  types: TypeExample[];
  products: string[];
  preference: string;
  filled: string[];
  busy: boolean;
  onProducts: (next: string[]) => void;
  onPreference: (next: string) => void;
  onSubmit: () => void;
}) {
  const ownSelected = filled.length === 0 && preference.trim() === '';

  return (
    <section className="rise-delay relative mt-8 sm:mt-10" aria-label={t.startAComparison}>
      <form
        className="relative max-w-3xl lg:max-w-4xl"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">{t.tryAType}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {types.map((item) => {
            const selected = isTypeSelected(item, products, preference);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onProducts([...item.products]);
                  onPreference(item.preference);
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
              onProducts(['', '', '']);
              onPreference('');
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              ownSelected
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
                        onProducts(next);
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
                        onProducts(products.filter((_, idx) => idx !== i));
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
                  onProducts([...products, '']);
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
                onChange={(e) => onPreference(e.target.value)}
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
              onProducts([...products, '']);
            }}
            className="mt-3 hidden text-sm font-medium text-pine transition hover:text-pine-deep disabled:opacity-30 lg:inline-block"
          >
            {t.addProduct}
          </button>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={busy || filled.length < MIN_PRODUCTS}
            className="min-h-12 w-full rounded-2xl bg-pine px-8 text-sm font-semibold tracking-wide text-paper-2 transition hover:bg-pine-deep disabled:opacity-45 sm:w-auto sm:min-w-[10.5rem]"
          >
            {busy ? t.researching : t.compare}
          </button>
          <p className="mt-2 text-xs text-ink-faint">{t.poweredBy}</p>
        </div>
      </form>
    </section>
  );
}
