import { BookmarkIcon, SettingsIcon } from 'lucide-react';
import type { Cover } from '@/games/cover-type';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { JSX } from 'react';
import { GameCover } from '@/components/GameCover';
import { resolveDefaultCover } from '@/games/cover';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';

type Common = {
  gameId: string;
  title: string;
  chips: string[];
  cover?: Cover;
  onPlay: () => void;
  onOpenCog: () => void;
};

type DefaultVariant = Common & { variant: 'default' };
type BookmarkVariant = Common & {
  variant: 'bookmark';
  bookmarkName: string;
  bookmarkColor: BookmarkColorKey;
};

type GameCardProps = DefaultVariant | BookmarkVariant;

export const GameCard = (props: GameCardProps): JSX.Element => {
  const { gameId, title, chips, onPlay, onOpenCog } = props;
  const cover =
    props.cover === undefined
      ? resolveDefaultCover(gameId)
      : props.cover;
  const colorKey =
    props.variant === 'bookmark'
      ? props.bookmarkColor
      : DEFAULT_BOOKMARK_COLOR;
  const ribbon = BOOKMARK_COLORS[colorKey].playBg;
  const playBg =
    props.variant === 'bookmark'
      ? ribbon
      : BOOKMARK_COLORS.indigo.playBg;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
      {props.variant === 'bookmark' && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: ribbon }}
        />
      )}

      <div className="relative p-2">
        <GameCover cover={cover} size="card" />
        {props.variant === 'bookmark' && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs text-white shadow"
            style={{ background: ribbon }}
          >
            <BookmarkIcon size={14} />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 px-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold leading-tight">{title}</h3>
          <button
            type="button"
            aria-label="Settings"
            onClick={onOpenCog}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <SettingsIcon size={14} />
          </button>
        </div>

        {props.variant === 'bookmark' && (
          <p className="text-xs italic text-muted-foreground">
            {props.bookmarkName}
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

        <button
          type="button"
          aria-label="Play"
          onClick={onPlay}
          className="mt-2 rounded-lg py-2 text-sm font-bold text-white"
          style={{ background: playBg }}
        >
          Play
        </button>
      </div>
    </div>
  );
};
