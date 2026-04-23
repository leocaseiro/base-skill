import { useEffect, useState } from 'react';

const QUERY = '(orientation: landscape) and (max-height: 480px)';

export const useChipsVisibleDefault = (): boolean => {
  const [isLandscapeShort, setLandscapeShort] = useState<boolean>(
    () => {
      if (typeof matchMedia === 'undefined') return false;
      return matchMedia(QUERY).matches;
    },
  );

  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mql = matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent | { matches: boolean }) => {
      setLandscapeShort(e.matches);
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

  return !isLandscapeShort;
};
