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
  bg: string;
  border: string;
  tagBg: string;
  tagText: string;
  playBg: string;
  headerText: string;
};

export const BOOKMARK_COLORS: Record<BookmarkColorKey, ColorTokens> = {
  indigo: {
    bg: '#eef2ff',
    border: '#c7d2fe',
    tagBg: '#e0e7ff',
    tagText: '#3730a3',
    playBg: '#6366f1',
    headerText: '#3730a3',
  },
  teal: {
    bg: '#f0fdfa',
    border: '#99f6e4',
    tagBg: '#ccfbf1',
    tagText: '#0f766e',
    playBg: '#14b8a6',
    headerText: '#0f766e',
  },
  rose: {
    bg: '#fff1f2',
    border: '#fecdd3',
    tagBg: '#ffe4e6',
    tagText: '#9f1239',
    playBg: '#f43f5e',
    headerText: '#9f1239',
  },
  amber: {
    bg: '#fffbeb',
    border: '#fde68a',
    tagBg: '#fef9c3',
    tagText: '#92400e',
    playBg: '#f59e0b',
    headerText: '#92400e',
  },
  sky: {
    bg: '#f0f9ff',
    border: '#bae6fd',
    tagBg: '#e0f2fe',
    tagText: '#0c4a6e',
    playBg: '#0ea5e9',
    headerText: '#0c4a6e',
  },
  lime: {
    bg: '#f7fee7',
    border: '#d9f99d',
    tagBg: '#ecfccb',
    tagText: '#3a5c00',
    playBg: '#84cc16',
    headerText: '#3a5c00',
  },
  purple: {
    bg: '#faf5ff',
    border: '#e9d5ff',
    tagBg: '#f3e8ff',
    tagText: '#5b21b6',
    playBg: '#a855f7',
    headerText: '#5b21b6',
  },
  orange: {
    bg: '#fff7ed',
    border: '#fed7aa',
    tagBg: '#ffedd5',
    tagText: '#7c2d12',
    playBg: '#f97316',
    headerText: '#7c2d12',
  },
  pink: {
    bg: '#fdf2f8',
    border: '#fbcfe8',
    tagBg: '#fce7f3',
    tagText: '#831843',
    playBg: '#ec4899',
    headerText: '#831843',
  },
  emerald: {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    tagBg: '#d1fae5',
    tagText: '#065f46',
    playBg: '#10b981',
    headerText: '#065f46',
  },
  slate: {
    bg: '#f8fafc',
    border: '#cbd5e1',
    tagBg: '#f1f5f9',
    tagText: '#1e293b',
    playBg: '#64748b',
    headerText: '#1e293b',
  },
  cyan: {
    bg: '#ecfeff',
    border: '#a5f3fc',
    tagBg: '#cffafe',
    tagText: '#164e63',
    playBg: '#06b6d4',
    headerText: '#164e63',
  },
};

export const DEFAULT_BOOKMARK_COLOR: BookmarkColorKey = 'indigo';
