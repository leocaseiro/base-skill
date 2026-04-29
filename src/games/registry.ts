import type { Cover } from './cover-type';

export type GameLevel = 'PK' | 'K' | '1' | '2' | '3' | '4';
export type GameSubject = 'math' | 'reading' | 'letters';

export type GameCatalogEntry = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  levels: GameLevel[];
  subject: GameSubject;
  defaultCover: Cover;
};

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: 'word-spell',
    titleKey: 'word-spell',
    descriptionKey: 'word-spell-description',
    levels: ['PK', 'K', '1'],
    subject: 'reading',
    defaultCover: {
      kind: 'emoji',
      emoji: '🔤',
      gradient: ['#fde68a', '#fb923c'],
    },
  },
  {
    id: 'number-match',
    titleKey: 'number-match',
    descriptionKey: 'number-match-description',
    levels: ['1', '2'],
    subject: 'math',
    defaultCover: {
      kind: 'emoji',
      emoji: '🔢',
      gradient: ['#bae6fd', '#6366f1'],
    },
  },
  {
    id: 'sort-numbers',
    titleKey: 'sort-numbers',
    descriptionKey: 'sort-numbers-description',
    levels: ['K', '1', '2'],
    subject: 'math',
    defaultCover: {
      kind: 'emoji',
      emoji: '📊',
      gradient: ['#bbf7d0', '#10b981'],
    },
  },
  {
    id: 'spot-all',
    titleKey: 'spot-all',
    descriptionKey: 'spot-all-description',
    levels: ['PK', 'K', '1'],
    subject: 'letters',
    defaultCover: {
      kind: 'emoji',
      emoji: '🕵️',
      gradient: ['#ddd6fe', '#60a5fa'],
    },
  },
];
