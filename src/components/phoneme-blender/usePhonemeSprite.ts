import { useEffect, useState } from 'react';
import type { PhonemeSprite } from '#/data/words/phoneme-audio';
import { getPhonemeSprite } from '#/data/words/phoneme-audio';

export const usePhonemeSprite = (): PhonemeSprite | null => {
  const [sprite, setSprite] = useState<PhonemeSprite | null>(null);
  useEffect(() => {
    let cancelled = false;
    getPhonemeSprite().then((next) => {
      if (!cancelled) setSprite(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return sprite;
};
