import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Tracks the user's `prefers-reduced-motion` setting and updates live if
 * they toggle it (e.g. macOS System Settings or iOS Accessibility). Use
 * to gate vestibular-trigger animations like rapid shaking, screen-shake,
 * heavy parallax, or large confetti bursts.
 *
 * SSR/test-safe: returns `false` when matchMedia is unavailable.
 */
export const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof matchMedia === 'undefined') return false;
    return matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mql = matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent | { matches: boolean }) => {
      setReduced(e.matches);
    };
    mql.addEventListener(
      'change',
      handler as (e: MediaQueryListEvent) => void,
    );
    return () => {
      mql.removeEventListener(
        'change',
        handler as (e: MediaQueryListEvent) => void,
      );
    };
  }, []);

  return reduced;
};
