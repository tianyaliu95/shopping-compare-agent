import { useEffect, useRef } from 'react';

export function useFollowScroll(opts: {
  busy: boolean;
  status: string | null;
  stepCount: number;
  hasResult: boolean;
  hasError: boolean;
}) {
  const { busy, status, stepCount, hasResult, hasError } = opts;
  const resultRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const autoScrolling = useRef(false);

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
    if (!busy && !status && stepCount === 0 && !hasResult && !hasError) return;
    if (!hasResult && !followRef.current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    autoScrolling.current = true;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (hasResult) {
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
  }, [busy, status, stepCount, hasResult, hasError]);

  function resetFollow() {
    followRef.current = true;
  }

  return { resultRef, endRef, resetFollow };
}
