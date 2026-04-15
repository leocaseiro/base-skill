import type { JSX, ReactNode } from 'react';

type GameGridProps = {
  cards: ReactNode[];
};

export const GameGrid = ({ cards }: GameGridProps): JSX.Element => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {cards}
  </div>
);
