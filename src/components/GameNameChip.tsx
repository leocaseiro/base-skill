import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { DEFAULT_GAME_COLOR, GAME_COLORS } from '@/lib/game-colors';

type GameNameChipProps = {
  title: string;
  customGameName?: string;
  customGameColor?: GameColorKey;
  subject?: string;
};

export const GameNameChip = ({
  title,
  customGameName,
  customGameColor = DEFAULT_GAME_COLOR,
  subject,
}: GameNameChipProps): JSX.Element => {
  const colors = customGameName
    ? GAME_COLORS[customGameColor]
    : GAME_COLORS.slate;

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={
        {
          borderColor: colors.border,
          '--game-play': colors.playBg,
        } as React.CSSProperties
      }
    >
      <div className="game-bg flex min-h-12 items-center gap-2 px-3">
        <span className="game-text text-sm font-bold">{title}</span>
        {customGameName && (
          <span
            className="game-bg game-text rounded border px-2 py-0.5 text-xs font-semibold"
            style={{ borderColor: colors.border }}
          >
            {customGameName}
          </span>
        )}
        {!customGameName && subject && (
          <span className="game-bg rounded px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {subject}
          </span>
        )}
      </div>
    </div>
  );
};
