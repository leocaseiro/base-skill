import { useTranslation } from 'react-i18next';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { GameCatalogEntry } from '@/games/registry';
import { GameCard } from '@/components/GameCard';
import { Button } from '@/components/ui/button';

type GameGridProps = {
  entries: GameCatalogEntry[];
  savedConfigs: SavedGameConfigDoc[];
  onSaveConfig: (gameId: string, name: string) => Promise<void>;
  onRemoveConfig: (configId: string) => Promise<void>;
  onPlay: (gameId: string) => void;
  onPlayWithConfig: (gameId: string, configId: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const GameGrid = ({
  entries,
  savedConfigs,
  onSaveConfig,
  onRemoveConfig,
  onPlay,
  onPlayWithConfig,
  page,
  totalPages,
  onPageChange,
}: GameGridProps) => {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col gap-6">
      {entries.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          No games found
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {entries.map((entry) => (
            <GameCard
              key={entry.id}
              entry={entry}
              savedConfigs={savedConfigs.filter(
                (c) => c.gameId === entry.id,
              )}
              onSaveConfig={onSaveConfig}
              onRemoveConfig={onRemoveConfig}
              onPlay={onPlay}
              onPlayWithConfig={onPlayWithConfig}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-3"
          aria-label="Pagination"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {t('pagination.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('pagination.pageOf', { page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {t('pagination.next')}
          </Button>
        </nav>
      )}

      {totalPages <= 1 && (
        <nav
          className="flex items-center justify-center gap-3"
          aria-label="Pagination"
        >
          <Button variant="outline" size="sm" disabled>
            {t('pagination.previous')}
          </Button>
          <Button variant="outline" size="sm" disabled>
            {t('pagination.next')}
          </Button>
        </nav>
      )}
    </div>
  );
};
