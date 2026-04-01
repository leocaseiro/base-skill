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
    id: 'math-addition',
    titleKey: 'math-addition',
    levels: ['1', '2'],
    subject: 'math',
  },
  {
    id: 'math-subtraction',
    titleKey: 'math-subtraction',
    levels: ['1', '2', '3'],
    subject: 'math',
  },
  {
    id: 'placeholder-game',
    titleKey: 'placeholder-game',
    levels: ['PK', 'K'],
    subject: 'letters',
  },
];
