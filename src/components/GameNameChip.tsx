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
      style={{ borderColor: colors.border }}
    >
      <div
        className="flex min-h-12 items-center gap-2 px-3"
        style={{ background: colors.tagBg }}
      >
        <span
          className="text-sm font-bold"
          style={{ color: colors.headerText }}
        >
          {title}
        </span>
        {bookmarkName && (
          <span
            className="rounded px-2 py-0.5 text-xs font-semibold"
            style={{
              background: colors.tagBg,
              color: colors.headerText,
              border: `1px solid ${colors.border}`,
            }}
          >
            {bookmarkName}
          </span>
        )}
        {!bookmarkName && subject && (
          <span
            className="rounded px-2 py-0.5 text-xs font-medium text-muted-foreground"
            style={{ background: colors.bg }}
          >
            {subject}
          </span>
        )}
      </div>
    </div>
  );
};
