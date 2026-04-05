import type {
  GameCatalogEntry,
  GameLevel,
  GameSubject,
} from './registry';

export type CatalogFilter = {
  search: string;
  level: GameLevel | '';
  subject: GameSubject | '';
};

export function filterCatalog(
  catalog: GameCatalogEntry[],
  filter: CatalogFilter,
): GameCatalogEntry[] {
  return catalog.filter((entry) => {
    if (filter.level && !entry.levels.includes(filter.level))
      return false;
    if (filter.subject && entry.subject !== filter.subject)
      return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!entry.titleKey.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export type PaginateResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
};

export const sortByHasSavedConfigs = <T extends { id: string }>(
  entries: T[],
  gameIdsWithConfigs: Set<string>,
): T[] => {
  if (gameIdsWithConfigs.size === 0) return entries;
  return [...entries].toSorted((a, b) => {
    const aHas = gameIdsWithConfigs.has(a.id) ? 0 : 1;
    const bHas = gameIdsWithConfigs.has(b.id) ? 0 : 1;
    return aHas - bHas;
  });
};

export function paginateCatalog<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginateResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
  };
}
