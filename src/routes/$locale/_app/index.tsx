import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { GAME_CATALOG } from '@/games/registry';

export const Route = createFileRoute('/$locale/_app/')({
  component: HomeCatalog,
});

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
