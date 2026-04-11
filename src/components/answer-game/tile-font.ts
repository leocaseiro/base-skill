export type TileFontBase = 56 | 80;

const CLASS_BY_BASE_AND_LENGTH: Record<
  TileFontBase,
  readonly string[]
> = {
  56: [
    'text-2xl',
    'text-2xl',
    'text-2xl',
    'text-2xl',
    'text-xl',
    'text-base',
    'text-sm',
    'text-xs',
  ],
  80: [
    'text-3xl',
    'text-3xl',
    'text-3xl',
    'text-3xl',
    'text-2xl',
    'text-xl',
    'text-base',
    'text-sm',
  ],
};

export const getNumericTileFontClass = (
  labelLength: number,
  base: TileFontBase,
): string => {
  const tiers = CLASS_BY_BASE_AND_LENGTH[base];
  const safeLength = Math.max(0, Math.floor(labelLength));
  const index = Math.min(safeLength, tiers.length - 1);
  return tiers[index] ?? tiers.at(-1)!;
};
