import type { Cover } from '@/games/cover';
import type { JSX } from 'react';

type GameCoverProps = {
  cover: Cover;
  size: 'card' | 'hero';
};

const SIZE_CLASSES: Record<GameCoverProps['size'], string> = {
  card: 'aspect-[4/3] w-full rounded-2xl text-5xl',
  hero: 'aspect-[4/3] w-56 rounded-3xl text-7xl',
};

export const GameCover = ({
  cover,
  size,
}: GameCoverProps): JSX.Element => {
  const cls = SIZE_CLASSES[size];

  if (cover.kind === 'image') {
    return (
      <div
        className={`${cls} flex items-center justify-center overflow-hidden`}
        style={{ background: cover.background ?? 'var(--muted)' }}
      >
        <img
          src={cover.src}
          alt={cover.alt ?? ''}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const background = cover.gradient
    ? `linear-gradient(135deg, ${cover.gradient[0]}, ${cover.gradient[1]})`
    : 'var(--muted)';

  return (
    <div
      className={`${cls} flex items-center justify-center`}
      style={{ background }}
    >
      <span aria-hidden="true">{cover.emoji}</span>
    </div>
  );
};
