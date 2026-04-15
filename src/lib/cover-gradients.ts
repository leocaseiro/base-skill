export const GRADIENT_KEYS = [
  'indigoPurple',
  'roseAmber',
  'tealSky',
  'limeEmerald',
  'orangePink',
  'cyanSlate',
  'purplePink',
  'skyCyan',
] as const;

export type GradientKey = (typeof GRADIENT_KEYS)[number];

export const GRADIENTS: Record<GradientKey, [string, string]> = {
  indigoPurple: ['#6366f1', '#a855f7'],
  roseAmber: ['#f43f5e', '#f59e0b'],
  tealSky: ['#14b8a6', '#0ea5e9'],
  limeEmerald: ['#84cc16', '#10b981'],
  orangePink: ['#f97316', '#ec4899'],
  cyanSlate: ['#06b6d4', '#64748b'],
  purplePink: ['#a855f7', '#ec4899'],
  skyCyan: ['#0ea5e9', '#06b6d4'],
};

export const gradientCss = (pair: [string, string]): string =>
  `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;

export const findGradientKey = (
  pair: [string, string] | undefined,
): GradientKey | undefined => {
  if (!pair) return undefined;
  return GRADIENT_KEYS.find(
    (k) => GRADIENTS[k][0] === pair[0] && GRADIENTS[k][1] === pair[1],
  );
};

export const findGradientKeyFromCss = (
  css: string | undefined,
): GradientKey | undefined => {
  if (!css) return undefined;
  return GRADIENT_KEYS.find((k) => gradientCss(GRADIENTS[k]) === css);
};
