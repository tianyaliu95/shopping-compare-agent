import { useEffect, useState } from 'react';
import type { Copy } from '@/lib/i18n';

const SHOW_AFTER_PX = 600;

export function BackToTop({ t }: { t: Copy }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label={t.backToTop}
      title={t.backToTop}
      tabIndex={visible ? 0 : -1}
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      }}
      className={`fixed bottom-5 right-5 z-40 flex size-11 items-center justify-center rounded-full border border-line bg-paper-2/85 text-pine shadow-sm backdrop-blur transition duration-300 hover:bg-white hover:text-pine-deep sm:bottom-8 sm:right-8 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
        <path
          d="M10 16V5m0 0-5 5m5-5 5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
