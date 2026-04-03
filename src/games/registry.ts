export type GameLevel = 'PK' | 'K' | '1' | '2' | '3' | '4';
export type GameSubject = 'math' | 'reading' | 'letters';

export type GameCatalogEntry = {
  id: string;
  titleKey: string;
  levels: GameLevel[];
  subject: GameSubject;
};

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: 'word-spell',
    titleKey: 'word-spell',
    levels: ['PK', 'K', '1'],
    subject: 'reading',
  },
  {
    id: 'number-match',
    titleKey: 'number-match',
    levels: ['1', '2'],
    subject: 'math',
  },
];
