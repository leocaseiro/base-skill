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

// Distinct from `null` (which is a real "no settings doc" emission) so we can
// tell "RxDB hasn't emitted yet" apart from "emitted, but no doc exists".
const UNLOADED = Symbol('settings-unloaded');

type RawDoc = SettingsDoc | { toJSON: () => SettingsDoc } | null;

type UseSettingsResult = {
  settings: typeof DEFAULT_SETTINGS & Partial<SettingsDoc>;
  update: (patch: Partial<SettingsDoc>) => Promise<void>;
  /**
   * True while a DbProvider is present and the settings query has not emitted
   * yet. False outside a provider (Storybook, partial tests) or after a
   * db-open error, so callers that gate on it never wait forever.
   */
  isLoading: boolean;
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

  const rawDoc = useRxQuery<RawDoc | typeof UNLOADED>(
    query$,
    ctx ? UNLOADED : null,
  );

  // Loading only while a provider is present, hasn't errored, and the query
  // has not emitted yet. Outside a provider or on error we fall through to
  // defaults so callers gating on this are never blocked forever.
  const isLoading =
    ctx !== null && ctx.error === undefined && rawDoc === UNLOADED;

  const settings = useMemo((): UseSettingsResult['settings'] => {
    if (rawDoc === UNLOADED) {
      return { ...DEFAULT_SETTINGS };
    }
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

  return { settings, update, isLoading };
}
