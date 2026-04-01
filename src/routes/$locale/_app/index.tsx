import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ValidatorAdapter } from '@tanstack/react-router';
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
    return {
      search: typeof raw.search === 'string' ? raw.search : '',
      level: typeof raw.level === 'string' ? raw.level : '',
      subject: typeof raw.subject === 'string' ? raw.subject : '',
      page:
        typeof raw.page === 'number' && Number.isFinite(raw.page)
          ? raw.page
          : Number.parseInt(String(raw.page ?? '1'), 10) || 1,
    };
  },
};

const HomeCatalog = () => {
  const { t } = useTranslation('games');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Profile Picker</h1>
      <p className="mt-2 text-muted-foreground">
        Select or create a learner profile.
      </p>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Games</h2>
        <ul className="mt-3 list-inside list-disc space-y-1">
          {GAME_CATALOG.map((g) => (
            <li key={g.id}>{t(g.titleKey)}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export const Route = createFileRoute('/$locale/_app/')({
  validateSearch: catalogSearchValidator,
  component: HomeCatalog,
});
