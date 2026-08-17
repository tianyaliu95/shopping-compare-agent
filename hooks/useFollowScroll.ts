import { useEffect, useRef } from 'react';

const RESULT_SCROLL_MS = 1100;
const RESULT_TOP_GAP = 28;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

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
  const frameRef = useRef<number | null>(null);

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

    function stopAnimation() {
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      autoScrolling.current = false;
    }

    function glideTo(targetY: number) {
      const startY = window.scrollY;
      const distance = targetY - startY;
      if (Math.abs(distance) < 2) {
        stopAnimation();
        return;
      }
      const startedAt = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - startedAt) / RESULT_SCROLL_MS, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));
        if (progress < 1) {
          frameRef.current = window.requestAnimationFrame(step);
        } else {
          stopAnimation();
        }
      };
      frameRef.current = window.requestAnimationFrame(step);
    }

    const kickoff = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (hasResult && resultRef.current) {
          const targetY =
            resultRef.current.getBoundingClientRect().top + window.scrollY - RESULT_TOP_GAP;
          if (reduce) {
            window.scrollTo(0, targetY);
            autoScrolling.current = false;
            return;
          }
          window.addEventListener('wheel', stopAnimation, { passive: true, once: true });
          window.addEventListener('touchstart', stopAnimation, { passive: true, once: true });
          glideTo(targetY);
          return;
        }

        endRef.current?.scrollIntoView({
          behavior: reduce ? 'auto' : 'smooth',
          block: 'end',
        });
        window.setTimeout(() => {
          autoScrolling.current = false;
        }, reduce ? 50 : 450);
      });
    });

    return () => {
      window.cancelAnimationFrame(kickoff);
      window.removeEventListener('wheel', stopAnimation);
      window.removeEventListener('touchstart', stopAnimation);
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [busy, status, stepCount, hasResult, hasError]);

  function resetFollow() {
    followRef.current = true;
  }

  return { resultRef, endRef, resetFollow };
}
