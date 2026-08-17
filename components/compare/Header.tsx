import type { Copy, Locale } from '@/lib/i18n';

export function Header({
  locale,
  t,
  onLocale,
}: {
  locale: Locale;
  t: Copy;
  onLocale: (next: Locale) => void;
}) {
  return (
    <header className="rise relative pb-2">
      <div className="relative z-10 flex justify-end">
        <div className="flex items-center gap-1.5 text-sm">
          <button
            type="button"
            onClick={() => onLocale('en')}
            className={locale === 'en' ? 'font-semibold text-ink' : 'text-ink-faint hover:text-ink'}
          >
            EN
          </button>
          <span className="text-ink-faint">/</span>
          <button
            type="button"
            onClick={() => onLocale('zh')}
            className={locale === 'zh' ? 'font-semibold text-ink' : 'text-ink-faint hover:text-ink'}
          >
            中文
          </button>
        </div>
      </div>
      <div className="vs-mark" aria-hidden>
        vs
      </div>
      <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-pine">{t.kicker}</p>
      <h1 className="relative mt-3 max-w-[14ch] font-display text-[2.5rem] font-extrabold leading-[1.06] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.25rem]">
        {t.titleLine1}
        <span className="block">{t.titleLine2}</span>
      </h1>
      <p className="relative mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-muted sm:mt-5 sm:text-lg">
        {t.subtitle}
      </p>
    </header>
  );
}
