import { useBookmarks } from './useBookmarks';
import { Button } from '#/components/ui/button';
import { createStorybookDatabase } from '#/db';
import { DbProvider } from '#/providers/DbProvider';

const GAME_IDS = [
  'math-addition',
  'math-subtraction',
  'placeholder-game',
];

const openStorybookDatabase = () => createStorybookDatabase();

const BookmarksInner = () => {
  const { bookmarkedIds, toggle } = useBookmarks();

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-muted-foreground text-sm">
        Bookmarked:{' '}
        {bookmarkedIds.size === 0
          ? 'none'
          : [...bookmarkedIds].join(', ')}
      </p>
      <div className="flex flex-wrap gap-2">
        {GAME_IDS.map((id) => (
          <Button
            key={id}
            size="sm"
            variant={bookmarkedIds.has(id) ? 'default' : 'outline'}
            onClick={() => void toggle(id)}
          >
            {bookmarkedIds.has(id) ? '★' : '☆'} {id}
          </Button>
        ))}
      </div>
    </div>
  );
};

export const UseBookmarksDemo = () => (
  <DbProvider openDatabase={openStorybookDatabase}>
    <BookmarksInner />
  </DbProvider>
);
