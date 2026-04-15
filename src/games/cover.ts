export type Cover =
  | {
      kind: 'emoji';
      emoji: string;
      gradient?: [string, string];
    }
  | {
      kind: 'image';
      src: string;
      alt?: string;
      background?: string;
    };

const DEFAULT_COVERS: Record<string, Cover> = {
  'word-spell': {
    kind: 'emoji',
    emoji: '🔤',
    gradient: ['#fde68a', '#fb923c'],
  },
  'number-match': {
    kind: 'emoji',
    emoji: '🔢',
    gradient: ['#bae6fd', '#6366f1'],
  },
  'sort-numbers': {
    kind: 'emoji',
    emoji: '📊',
    gradient: ['#bbf7d0', '#10b981'],
  },
};

export const resolveDefaultCover = (gameId: string): Cover => {
  const cover = DEFAULT_COVERS[gameId];
  if (!cover) throw new Error(`unknown gameId: ${gameId}`);
  return cover;
};

export const resolveCover = (
  doc: { cover?: Cover },
  gameId: string,
): Cover => doc.cover ?? resolveDefaultCover(gameId);
