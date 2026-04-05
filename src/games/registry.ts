export type GameLevel = 'PK' | 'K' | '1' | '2' | '3' | '4';
export type GameSubject = 'math' | 'reading' | 'letters';

export type GameCatalogEntry = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  levels: GameLevel[];
  subject: GameSubject;
};

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: 'word-spell',
    titleKey: 'word-spell',
    descriptionKey: 'word-spell-description',
    levels: ['PK', 'K', '1'],
    subject: 'reading',
  },
  {
    id: 'number-match',
    titleKey: 'number-match',
    descriptionKey: 'number-match-description',
    levels: ['1', '2'],
    subject: 'math',
  },
  {
    id: 'sort-numbers',
    titleKey: 'sort-numbers',
    descriptionKey: 'sort-numbers-description',
    levels: ['K', '1', '2'],
    subject: 'math',
  },
];
