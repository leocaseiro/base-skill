import { createContext, useContext } from 'react';

export interface GameRoundProgress {
  current: number; // 1-based
  total: number;
}

export const GameRoundContext = createContext<GameRoundProgress | null>(
  null,
);

/** Returns override from AnswerGame if present; null otherwise. */
export const useGameRoundProgress = (): GameRoundProgress | null =>
  useContext(GameRoundContext);
