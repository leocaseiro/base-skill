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
};

export const BOOKMARK_COLORS: Record<BookmarkColorKey, ColorTokens> = {
  indigo: { border: '#c7d2fe', playBg: '#6366f1' },
  teal: { border: '#99f6e4', playBg: '#14b8a6' },
  rose: { border: '#fecdd3', playBg: '#f43f5e' },
  amber: { border: '#fde68a', playBg: '#f59e0b' },
  sky: { border: '#bae6fd', playBg: '#0ea5e9' },
  lime: { border: '#d9f99d', playBg: '#84cc16' },
  purple: { border: '#e9d5ff', playBg: '#a855f7' },
  orange: { border: '#fed7aa', playBg: '#f97316' },
  pink: { border: '#fbcfe8', playBg: '#ec4899' },
  emerald: { border: '#a7f3d0', playBg: '#10b981' },
  slate: { border: '#cbd5e1', playBg: '#64748b' },
  cyan: { border: '#a5f3fc', playBg: '#06b6d4' },
};

export const DEFAULT_BOOKMARK_COLOR: BookmarkColorKey = 'indigo';
