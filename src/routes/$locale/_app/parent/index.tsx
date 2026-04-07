import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { EMPTY } from 'rxjs';
import type { AppMetaDoc } from '@/db/schemas/app-meta';
import { useRxDB } from '@/db/hooks/useRxDB';
import { useRxQuery } from '@/db/hooks/useRxQuery';
import { APP_VERSION, IS_BETA } from '@/lib/version';

const AboutSection = () => {
  const { db } = useRxDB();

  const meta$ = useMemo(
    () => (db ? db.app_meta.findOne('singleton').$ : EMPTY),
    [db],
  );
  const meta = useRxQuery<{ toJSON: () => AppMetaDoc } | null>(
    meta$,
    null,
  );
  const metaDoc = meta?.toJSON();

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">About</h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Version</dt>
        <dd>v{APP_VERSION}</dd>

        <dt className="text-muted-foreground">Channel</dt>
        <dd>{IS_BETA ? 'Beta' : 'Stable'}</dd>

        {metaDoc && (
          <>
            <dt className="text-muted-foreground">Install ID</dt>
            <dd className="font-mono text-xs">{metaDoc.installId}</dd>

            <dt className="text-muted-foreground">Schema version</dt>
            <dd>{metaDoc.rxdbSchemaVersion}</dd>
          </>
        )}
      </dl>
    </section>
  );
};

const ParentHome = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Parent Settings</h1>
    <p className="mt-2 text-muted-foreground">
      Manage learner profiles and app configuration.
    </p>
    <AboutSection />
  </div>
);

export const Route = createFileRoute('/$locale/_app/parent/')({
  component: ParentHome,
});
