// src/lib/bookmark-colors.ts
export const BOOKMARK_COLOR_KEYS = [
  'indigo',
  'teal',
  'rose',
  'amber',
  'sky',
  'lime',
  'purple',
  'orange',
  'pink',
  'emerald',
  'slate',
  'cyan',
] as const;

export type BookmarkColorKey = (typeof BOOKMARK_COLOR_KEYS)[number];

export type ColorTokens = {
  border: string; // used for selected ring in colour picker
  playBg: string; // primary colour — all other uses derived from this via CSS utility classes
  text: string; // contrast-safe colour for text on light card backgrounds (≥3:1 large bold)
};

export const BOOKMARK_COLORS: Record<BookmarkColorKey, ColorTokens> = {
  indigo: { border: '#c7d2fe', playBg: '#6366f1', text: '#4338ca' },
  teal: { border: '#99f6e4', playBg: '#14b8a6', text: '#0f766e' },
  rose: { border: '#fecdd3', playBg: '#f43f5e', text: '#be123c' },
  amber: { border: '#fde68a', playBg: '#f59e0b', text: '#b45309' },
  sky: { border: '#bae6fd', playBg: '#0ea5e9', text: '#0369a1' },
  lime: { border: '#d9f99d', playBg: '#84cc16', text: '#4d7c0f' },
  purple: { border: '#e9d5ff', playBg: '#a855f7', text: '#7e22ce' },
  orange: { border: '#fed7aa', playBg: '#f97316', text: '#c2410c' },
  pink: { border: '#fbcfe8', playBg: '#ec4899', text: '#be185d' },
  emerald: { border: '#a7f3d0', playBg: '#10b981', text: '#047857' },
  slate: { border: '#cbd5e1', playBg: '#64748b', text: '#334155' },
  cyan: { border: '#a5f3fc', playBg: '#06b6d4', text: '#0e7490' },
};

export const DEFAULT_BOOKMARK_COLOR: BookmarkColorKey = 'indigo';
