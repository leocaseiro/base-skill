import { FONT_POOL, SIZE_POOL } from './pools';

export interface SpotAllVisualVariation {
  fontFamily?: string;
  fontSizePx: number;
}

export const pickVariation = (
  rng: () => number,
  enabledFontIds: readonly string[],
): SpotAllVisualVariation => {
  const fonts = FONT_POOL.filter((f) => enabledFontIds.includes(f.id));
  const font =
    fonts.length > 0
      ? fonts[Math.floor(rng() * fonts.length)]
      : undefined;
  return {
    fontFamily: font?.family,
    fontSizePx: SIZE_POOL[Math.floor(rng() * SIZE_POOL.length)]!,
  };
};
