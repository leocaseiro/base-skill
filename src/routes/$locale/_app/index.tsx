import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameLevel, GameSubject } from '@/games/registry';
import type { ValidatorAdapter } from '@tanstack/react-router';
import { GameGrid } from '@/components/GameGrid';
import { LevelRow } from '@/components/LevelRow';
import { useSavedConfigs } from '@/db/hooks/useSavedConfigs';
import {
  filterCatalog,
  paginateCatalog,
  sortByHasSavedConfigs,
} from '@/games/catalog-utils';
import { GAME_CATALOG } from '@/games/registry';

type CatalogSearchInput = {
  search?: string;
  level?: string;
  subject?: string;
  page?: number | string;
};

type CatalogSearchOutput = {
  search: string;
  level: string;
  subject: string;
  page: number;
};

const catalogSearchValidator: ValidatorAdapter<
  CatalogSearchInput,
  CatalogSearchOutput
> = {
  types: {
    input: {} as CatalogSearchInput,
    output: {} as CatalogSearchOutput,
  },
  parse: (input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    const pageRaw =
      typeof raw.page === 'number' && Number.isFinite(raw.page)
        ? raw.page
        : Number.parseInt(String(raw.page ?? '1'), 10) || 1;
    return {
      search: typeof raw.search === 'string' ? raw.search : '',
      level: typeof raw.level === 'string' ? raw.level : '',
      subject: typeof raw.subject === 'string' ? raw.subject : '',
      page: Math.max(1, pageRaw),
    };
  },
};

const PAGE_SIZE = 12;

const HomeScreen = () => {
  const { t } = useTranslation('common');
  const { level, subject, search, page } = Route.useSearch();
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate({ from: '/$locale/' });
  const { savedConfigs, gameIdsWithConfigs, save, remove } =
    useSavedConfigs();

  const filtered = useMemo(() => {
    const result = filterCatalog(GAME_CATALOG, {
      search,
      level: level as GameLevel | '',
      subject: subject as GameSubject | '',
    });
    return sortByHasSavedConfigs(result, gameIdsWithConfigs);
  }, [search, level, subject, gameIdsWithConfigs]);

  const {
    items,
    page: safePage,
    totalPages,
  } = useMemo(
    () => paginateCatalog(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const updateSearch = (
    patch: Partial<{
      level: string;
      subject: string;
      search: string;
      page: number;
    }>,
  ) => {
    void navigate({
      search: (prev) => ({ ...prev, ...patch }),
    });
  };

  const handlePlay = (gameId: string) => {
    void navigate({
      to: '/$locale/game/$gameId',
      params: { locale, gameId },
      search: { configId: undefined },
    });
  };

  const handlePlayWithConfig = (gameId: string, configId: string) => {
    void navigate({
      to: '/$locale/game/$gameId',
      params: { locale, gameId },
      search: { configId },
    });
  };

  const handleSaveConfig = async (
    gameId: string,
    name: string,
  ): Promise<void> => {
    await save({ gameId, name, config: {} });
  };

  return (
    <div className="px-4 py-2">
      <h1 className="sr-only">{t('home.title')}</h1>
      <LevelRow
        currentLevel={level as GameLevel | ''}
        onLevelChange={(l) => updateSearch({ level: l, page: 1 })}
      />
      <div className="mt-4">
        <GameGrid
          entries={items}
          savedConfigs={savedConfigs}
          onSaveConfig={handleSaveConfig}
          onRemoveConfig={remove}
          onPlay={handlePlay}
          onPlayWithConfig={handlePlayWithConfig}
          page={safePage}
          totalPages={totalPages}
          onPageChange={(p) => updateSearch({ page: p })}
        />
      </div>
    </div>
  );
};

export const Route = createFileRoute('/$locale/_app/')({
  validateSearch: catalogSearchValidator,
  component: HomeScreen,
});
