import { useContext, useMemo } from 'react';
import { EMPTY } from 'rxjs';
import { useRxQuery } from './useRxQuery';
import type { SettingsDoc } from '@/db/schemas/settings';
import { DbContext } from '@/providers/DbProvider';

const ANONYMOUS_PROFILE_ID = 'anonymous';
const ANONYMOUS_SETTINGS_ID = 'settings:anonymous';

const DEFAULT_SETTINGS: Omit<SettingsDoc, 'updatedAt'> = {
  id: ANONYMOUS_SETTINGS_ID,
  profileId: ANONYMOUS_PROFILE_ID,
  soundEffectsVolume: 0.8,
  voiceVolume: 0.8,
  speechRate: 1,
  ttsEnabled: true,
  showSubtitles: true,
  tapForgivenessThreshold: 17,
  tapForgivenessTimeMs: 150,
};

function plainSettingsFromQuery(
  doc: SettingsDoc | null | { toJSON: () => SettingsDoc },
): SettingsDoc | null {
  if (doc === null) {
    return null;
  }
  if (
    typeof (doc as { toJSON?: () => SettingsDoc }).toJSON === 'function'
  ) {
    return (doc as { toJSON: () => SettingsDoc }).toJSON();
  }
  return doc as SettingsDoc;
}

type UseSettingsResult = {
  settings: typeof DEFAULT_SETTINGS & Partial<SettingsDoc>;
  update: (patch: Partial<SettingsDoc>) => Promise<void>;
};

export function useSettings(): UseSettingsResult {
  // Use useContext directly (not useRxDB) so consumers rendered outside
  // a DbProvider — Storybook stories, partial-tree component tests —
  // degrade gracefully to DEFAULT_SETTINGS instead of throwing. Real
  // production callers always sit under the _app.tsx DbProvider so the
  // ctx will be present and behavior is unchanged for them.
  const ctx = useContext(DbContext);
  const db = ctx?.db ?? null;

  const query$ = useMemo(
    () => (db ? db.settings.findOne(ANONYMOUS_SETTINGS_ID).$ : EMPTY),
    [db],
  );

  const rawDoc = useRxQuery<
    SettingsDoc | { toJSON: () => SettingsDoc } | null
  >(query$, null);

  const settings = useMemo((): UseSettingsResult['settings'] => {
    const doc = plainSettingsFromQuery(rawDoc);
    if (doc === null) {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...doc };
  }, [rawDoc]);

  const update = async (patch: Partial<SettingsDoc>): Promise<void> => {
    if (!db) return;
    const existing = await db.settings
      .findOne(ANONYMOUS_SETTINGS_ID)
      .exec();
    const now = new Date().toISOString();
    if (existing) {
      await existing.patch({ ...patch, updatedAt: now });
    } else {
      const newDoc: SettingsDoc = {
        ...DEFAULT_SETTINGS,
        ...patch,
        updatedAt: now,
      };
      await db.settings.insert(newDoc);
    }
  };

  return { settings, update };
}
