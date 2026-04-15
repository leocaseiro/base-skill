import { nanoid } from 'nanoid';
import { useCallback, useMemo } from 'react';
import { EMPTY } from 'rxjs';
import { useRxDB } from './useRxDB';
import { useRxQuery } from './useRxQuery';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { Cover } from '@/games/cover-type';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import {
  ANONYMOUS_PROFILE_ID,
  isLastSessionSavedConfigId,
  lastSessionSavedConfigId,
} from '@/db/last-session-game-config';

type SaveInput = {
  gameId: string;
  name: string;
  config: Record<string, unknown>;
  color: string;
  cover?: Cover;
};

type UpdateConfigExtras = {
  cover?: Cover;
  color?: BookmarkColorKey;
};

type UseSavedConfigsResult = {
  savedConfigs: SavedGameConfigDoc[];
  gameIdsWithConfigs: Set<string>;
  getByGameId: (gameId: string) => SavedGameConfigDoc[];
  /** Map of gameId → last-session config (if any). Drives default-card chips on the home grid. */
  lastSessionConfigs: Record<string, Record<string, unknown>>;
  save: (input: SaveInput) => Promise<string>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
  updateConfig: (
    id: string,
    config: Record<string, unknown>,
    name?: string,
    extras?: UpdateConfigExtras,
  ) => Promise<void>;
  /** Upserts IndexedDB doc for "resume last settings" (not shown as a named chip) */
  persistLastSessionConfig: (
    gameId: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
};

export const useSavedConfigs = (): UseSavedConfigsResult => {
  const { db } = useRxDB();

  const query$ = useMemo(
    () =>
      db
        ? db.saved_game_configs.find({
            selector: { profileId: ANONYMOUS_PROFILE_ID },
            sort: [{ createdAt: 'asc' }],
          }).$
        : EMPTY,
    [db],
  );

  const docs = useRxQuery<SavedGameConfigDoc[]>(query$, []);

  const savedConfigs = useMemo(
    () => docs.filter((d) => !isLastSessionSavedConfigId(d.id)),
    [docs],
  );

  const lastSessionConfigs = useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {};
    for (const d of docs) {
      if (isLastSessionSavedConfigId(d.id)) map[d.gameId] = d.config;
    }
    return map;
  }, [docs]);

  const gameIdsWithConfigs = useMemo(
    () => new Set(savedConfigs.map((d) => d.gameId)),
    [savedConfigs],
  );

  const getByGameId = (gameId: string): SavedGameConfigDoc[] =>
    savedConfigs.filter((d) => d.gameId === gameId);

  const save = async ({
    gameId,
    name,
    config,
    color,
    cover,
  }: SaveInput): Promise<string> => {
    if (!db) throw new Error('Database not ready');
    const trimmed = name.trim();
    const namesForGame = savedConfigs
      .filter((d) => d.gameId === gameId)
      .map((d) => d.name);
    if (namesForGame.includes(trimmed)) {
      throw new Error(
        `A saved config named "${trimmed}" already exists for this game`,
      );
    }
    const doc: SavedGameConfigDoc = {
      id: nanoid(21),
      profileId: ANONYMOUS_PROFILE_ID,
      gameId,
      name: trimmed,
      // JSON round-trip drops non-serializable fields (e.g. SortNumbers' levelMode.generateNextLevel function) so RxDB can persist the config.
      // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone throws on functions; we want them silently dropped
      config: JSON.parse(JSON.stringify(config)) as Record<
        string,
        unknown
      >,
      color,
      createdAt: new Date().toISOString(),
      ...(cover ? { cover } : {}),
    };
    await db.saved_game_configs.insert(doc);
    return doc.id;
  };

  const remove = async (id: string): Promise<void> => {
    if (!db) return;
    const doc = await db.saved_game_configs.findOne(id).exec();
    if (doc) await doc.remove();
  };

  const rename = async (id: string, newName: string): Promise<void> => {
    if (!db) return;
    const doc = await db.saved_game_configs.findOne(id).exec();
    if (!doc) return;
    const trimmed = newName.trim();
    const namesForGame = savedConfigs
      .filter((d) => d.gameId === doc.gameId && d.id !== id)
      .map((d) => d.name);
    if (namesForGame.includes(trimmed)) {
      throw new Error(
        `A saved config named "${trimmed}" already exists for this game`,
      );
    }
    await doc.incrementalPatch({ name: trimmed });
  };

  const updateConfig = useCallback(
    async (
      id: string,
      config: Record<string, unknown>,
      name?: string,
      extras?: UpdateConfigExtras,
    ): Promise<void> => {
      if (!db) return;
      const doc = await db.saved_game_configs.findOne(id).exec();
      if (!doc) return;
      const patch: Partial<SavedGameConfigDoc> = {
        // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone throws on functions; we want them silently dropped
        config: JSON.parse(JSON.stringify(config)) as Record<
          string,
          unknown
        >,
      };
      if (name !== undefined) {
        const trimmed = name.trim();
        const siblings = await db.saved_game_configs
          .find({
            selector: {
              gameId: doc.gameId,
              id: { $ne: id },
            },
          })
          .exec();
        const namesForGame = siblings.map((d) => d.name);
        if (namesForGame.includes(trimmed)) {
          throw new Error(
            `A saved config named "${trimmed}" already exists for this game`,
          );
        }
        patch.name = trimmed;
      }
      if (extras?.cover !== undefined) {
        patch.cover = extras.cover;
      }
      if (extras?.color !== undefined) {
        patch.color = extras.color;
      }
      await doc.incrementalPatch(patch);
    },
    [db],
  );

  const persistLastSessionConfig = useCallback(
    async (gameId: string, config: Record<string, unknown>) => {
      if (!db) return;
      const id = lastSessionSavedConfigId(gameId);
      const now = new Date().toISOString();
      const existing = await db.saved_game_configs.findOne(id).exec();
      await (existing
        ? existing.incrementalPatch({ config, createdAt: now })
        : db.saved_game_configs.insert({
            id,
            profileId: ANONYMOUS_PROFILE_ID,
            gameId,
            name: '__last_session__',
            config,
            color: 'indigo',
            createdAt: now,
          }));
    },
    [db],
  );

  return {
    savedConfigs,
    gameIdsWithConfigs,
    getByGameId,
    lastSessionConfigs,
    save,
    remove,
    rename,
    updateConfig,
    persistLastSessionConfig,
  };
};
