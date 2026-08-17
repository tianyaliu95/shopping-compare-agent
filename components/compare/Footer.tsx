import type { Copy } from '@/lib/i18n';
import { SITE_URL } from './constants';

export function Footer({ t }: { t: Copy }) {
  return (
    <footer className="relative mt-28 border-t border-line pt-2 text-right text-xs text-ink-faint">
      <p>
        {t.copyrightYear(new Date().getFullYear())}{' '}
        <a
          href={SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-ink-muted underline decoration-transparent underline-offset-4 transition hover:text-pine hover:decoration-pine/40"
        >
          {t.copyrightName}
        </a>
      </p>
    </footer>
  );
}
