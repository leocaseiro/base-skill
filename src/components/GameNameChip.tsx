import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { JSX } from 'react';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';

type GameNameChipProps = {
  title: string;
  bookmarkName?: string;
  bookmarkColor?: BookmarkColorKey;
  subject?: string;
};

export const GameNameChip = ({
  title,
  bookmarkName,
  bookmarkColor = DEFAULT_BOOKMARK_COLOR,
  subject,
}: GameNameChipProps): JSX.Element => {
  const colors = bookmarkName
    ? BOOKMARK_COLORS[bookmarkColor]
    : BOOKMARK_COLORS.slate;

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
