import { BookmarkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GameCatalogEntry } from '@/games/registry';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type GameCardProps = {
  entry: GameCatalogEntry;
  isBookmarked: boolean;
  onBookmarkToggle: (gameId: string) => void;
  onPlay: (gameId: string) => void;
};

export const GameCard = ({
  entry,
  isBookmarked,
  onBookmarkToggle,
  onPlay,
}: GameCardProps) => {
  const { t } = useTranslation('games');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            {t(entry.titleKey)}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              isBookmarked
                ? tCommon('bookmark.remove')
                : tCommon('bookmark.add')
            }
            onClick={() => onBookmarkToggle(entry.id)}
          >
            <BookmarkIcon
              size={16}
              className={isBookmarked ? 'fill-current' : ''}
            />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {entry.levels.map((level) => (
            <span
              key={level}
              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
            >
              {tCommon(`levels.${level}`)}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={() => onPlay(entry.id)}>
          Play
        </Button>
      </CardContent>
    </Card>
  );
};
