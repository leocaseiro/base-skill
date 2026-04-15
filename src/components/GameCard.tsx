import { BookmarkIcon, SettingsIcon } from 'lucide-react';
import type { Cover } from '@/games/cover-type';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { JSX } from 'react';
import { GameCover } from '@/components/GameCover';
import { resolveDefaultCover } from '@/games/cover';
import { BOOKMARK_COLORS } from '@/lib/bookmark-colors';

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
  const badgeBg =
    props.variant === 'bookmark'
      ? BOOKMARK_COLORS[props.bookmarkColor].playBg
      : undefined;

  const headingText =
    props.variant === 'bookmark' ? props.bookmarkName : title;
  const subtitleText = props.variant === 'bookmark' ? title : undefined;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
      <button
        type="button"
        aria-label={`Play ${headingText}`}
        onClick={onPlay}
        className="flex flex-col text-left active:scale-[0.98]"
      >
        <div className="relative p-2">
          <GameCover cover={cover} size="card" />
          {props.variant === 'bookmark' && badgeBg && (
            <span
              aria-hidden="true"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs text-white shadow"
              style={{ background: badgeBg }}
            >
              <BookmarkIcon size={14} />
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 px-3 pb-3">
          <h2 className="text-sm font-bold leading-tight text-foreground">
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
