export interface SpotAllFontPoolEntry {
  id: string;
  family: string;
  label: string;
}

export const FONT_POOL: readonly SpotAllFontPoolEntry[] = [
  { id: 'andika', family: 'Andika, sans-serif', label: 'Andika' },
  {
    id: 'edu-nsw',
    family: '"Edu NSW ACT Foundation", cursive',
    label: 'Edu NSW',
  },
  { id: 'nunito', family: 'Nunito, sans-serif', label: 'Nunito' },
  {
    id: 'fraunces',
    family: 'Fraunces, Georgia, serif',
    label: 'Fraunces',
  },
  { id: 'manrope', family: 'Manrope, sans-serif', label: 'Manrope' },
  {
    id: 'monospace',
    family: 'ui-monospace, "SF Mono", monospace',
    label: 'Monospace',
  },
] as const;

export const COLOR_POOL = [
  'var(--skin-variation-1)',
  'var(--skin-variation-2)',
  'var(--skin-variation-3)',
  'var(--skin-variation-4)',
  'var(--skin-variation-5)',
  'var(--skin-variation-6)',
] as const;

export const SIZE_POOL = [38, 42, 46, 50] as const;

export const DEFAULT_ENABLED_FONT_IDS: readonly string[] =
  FONT_POOL.map((f) => f.id);
