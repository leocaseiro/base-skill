import { GAME_CATALOG } from './registry';
import type { Cover } from './cover-type';

export const resolveDefaultCover = (gameId: string): Cover => {
  const entry = GAME_CATALOG.find((g) => g.id === gameId);
  if (!entry) throw new Error(`unknown gameId: ${gameId}`);
  return entry.defaultCover;
};

export const resolveCover = (
  doc: { cover?: Cover },
  gameId: string,
): Cover => doc.cover ?? resolveDefaultCover(gameId);

export { type Cover } from './cover-type';
