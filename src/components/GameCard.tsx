import { CircleDashed, CircleDot, SettingsIcon } from 'lucide-react';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { GameCover } from '@/components/GameCover';
import { resolveDefaultCover } from '@/games/cover';

type Common = {
  gameId: string;
  title: string;
  chips: string[];
  cover?: Cover;
  onPlay: () => void;
  onOpenCog: () => void;
};

type DefaultVariant = Common & { variant: 'default' };
type CustomGameVariant = Common & {
  variant: 'customGame';
  customGameName: string;
  customGameColor: GameColorKey;
};

type GameCardProps = DefaultVariant | CustomGameVariant;

export const GameCard = (props: GameCardProps): JSX.Element => {
  const { gameId, title, chips, onPlay, onOpenCog } = props;
  const cover =
    props.cover === undefined
      ? resolveDefaultCover(gameId)
      : props.cover;

  const isCustom = props.variant === 'customGame';
  const headingText = isCustom ? props.customGameName : title;
  const subtitleText = isCustom ? title : undefined;

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm"
      data-card-type={isCustom ? 'customGame' : 'default'}
    >
      <button
        type="button"
        aria-label={`Play ${headingText}`}
        onClick={onPlay}
        className="flex flex-col text-left active:scale-[0.98]"
      >
        <div className="p-2">
          <GameCover cover={cover} size="card" />
        </div>

        <div className="flex flex-col gap-1 px-3 pb-3">
          <h2 className="flex items-center gap-1.5 text-sm font-bold leading-tight text-foreground">
            {isCustom ? (
              <CircleDot
                size={14}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
            ) : (
              <CircleDashed
                size={14}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
            )}
            {headingText}
          </h2>
          {subtitleText && (
            <p className="text-xs italic text-muted-foreground">
              {subtitleText}
            </p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </button>

      <button
        type="button"
        aria-label="Settings"
        onClick={onOpenCog}
        className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground shadow"
      >
        <SettingsIcon size={14} />
      </button>
    </div>
  );
};
