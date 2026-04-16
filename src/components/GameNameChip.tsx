import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { DEFAULT_GAME_COLOR, GAME_COLORS } from '@/lib/game-colors';

type GameNameChipProps = {
  title: string;
  bookmarkName?: string;
  bookmarkColor?: GameColorKey;
  subject?: string;
};

export const GameNameChip = ({
  title,
  bookmarkName,
  bookmarkColor = DEFAULT_GAME_COLOR,
  subject,
}: GameNameChipProps): JSX.Element => {
  const colors = bookmarkName
    ? GAME_COLORS[bookmarkColor]
    : GAME_COLORS.slate;

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={
        {
          borderColor: colors.border,
          '--bookmark-play': colors.playBg,
        } as React.CSSProperties
      }
    >
      <div className="bookmark-bg flex min-h-12 items-center gap-2 px-3">
        <span className="bookmark-text text-sm font-bold">{title}</span>
        {bookmarkName && (
          <span
            className="bookmark-bg bookmark-text rounded border px-2 py-0.5 text-xs font-semibold"
            style={{ borderColor: colors.border }}
          >
            {bookmarkName}
          </span>
        )}
        {!bookmarkName && subject && (
          <span className="bookmark-bg rounded px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {subject}
          </span>
        )}
      </div>
    </div>
  );
};
