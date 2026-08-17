'use client';

import { useEffect, useState } from 'react';
import { AgentLoop } from '@/components/compare/AgentLoop';
import { BackToTop } from '@/components/compare/BackToTop';
import { CompareForm } from '@/components/compare/CompareForm';
import { Footer } from '@/components/compare/Footer';
import { Header } from '@/components/compare/Header';
import { isTypeSelected } from '@/components/compare/helpers';
import { ResultSection } from '@/components/compare/ResultSection';
import { useCompareRun } from '@/hooks/useCompareRun';
import { useFollowScroll } from '@/hooks/useFollowScroll';
import { copy, detectLocale, STORAGE_KEY, TYPE_EXAMPLES, type Locale } from '@/lib/i18n';

export function CompareApp() {
  const [locale, setLocale] = useState<Locale>('en');
  const [products, setProducts] = useState(['', '', '']);
  const [preference, setPreference] = useState('');

  const filled = products.map((p) => p.trim()).filter(Boolean);
  const t = copy[locale];
  const { busy, status, steps, result, error, run } = useCompareRun(t);
  const { resultRef, endRef, resetFollow } = useFollowScroll({
    busy,
    status,
    stepCount: steps.length,
    hasResult: Boolean(result),
    hasError: Boolean(error),
  });

  useEffect(() => {
    const next = detectLocale();
    setLocale(next);
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  }, []);

  function switchLocale(next: Locale) {
    const currentType = TYPE_EXAMPLES[locale].find((item) =>
      isTypeSelected(item, products, preference)
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

  return (
    <div className="page-shell mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 lg:px-8">
      {busy && (
        <div className="fixed inset-x-0 top-0 z-30 h-1 overflow-hidden bg-pine/15" aria-hidden>
          <div className="progress-bar h-full w-full bg-pine" />
        </div>
      )}

      <Header locale={locale} t={t} onLocale={switchLocale} />

      <CompareForm
        t={t}
        types={TYPE_EXAMPLES[locale]}
        products={products}
        preference={preference}
        filled={filled}
        busy={busy}
        onProducts={setProducts}
        onPreference={setPreference}
        onSubmit={() => {
          resetFollow();
          void run({ products: filled, preference, locale });
        }}
      />

      <AgentLoop t={t} status={status} steps={steps} busy={busy} />

      {error && (
        <p className="reveal mt-8 border-l-2 border-red-700 pl-4 text-sm leading-relaxed text-red-800" role="alert">
          {error}
        </p>
      )}

      {result && <ResultSection ref={resultRef} result={result} t={t} />}
      <div ref={endRef} className="h-px" aria-hidden />
      <Footer t={t} />
      <BackToTop t={t} />
    </div>
  );
}
