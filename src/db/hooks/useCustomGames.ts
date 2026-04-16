import { nanoid } from 'nanoid';
import { useCallback, useMemo } from 'react';
import { EMPTY } from 'rxjs';
import { useRxDB } from './useRxDB';
import { useRxQuery } from './useRxQuery';
import type { CustomGameDoc } from '@/db/schemas/custom_games';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import {
  ANONYMOUS_PROFILE_ID,
  isLastSessionConfigId,
  lastSessionConfigId,
} from '@/db/last-session-game-config';

type SaveInput = {
  gameId: string;
  name: string;
  config: Record<string, unknown>;
  color: string;
  cover?: Cover;
};

type UpdateExtras = {
  cover?: Cover;
  color?: GameColorKey;
};

type UseCustomGamesResult = {
  customGames: CustomGameDoc[];
  gameIdsWithCustomGames: Set<string>;
  getByGameId: (gameId: string) => CustomGameDoc[];
  lastSessionConfigs: Record<string, Record<string, unknown>>;
  save: (input: SaveInput) => Promise<string>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
  update: (
    id: string,
    config: Record<string, unknown>,
    name?: string,
    extras?: UpdateExtras,
  ) => Promise<void>;
  persistLastSessionConfig: (
    gameId: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
};

export const useCustomGames = (): UseCustomGamesResult => {
  const { db } = useRxDB();

  const customGamesQuery$ = useMemo(
    () =>
      db
        ? db.custom_games.find({
            selector: { profileId: ANONYMOUS_PROFILE_ID },
            sort: [{ createdAt: 'asc' }],
          }).$
        : EMPTY,
    [db],
  );

  const savedGameConfigsQuery$ = useMemo(
    () =>
      db
        ? db.saved_game_configs.find({
            selector: { profileId: ANONYMOUS_PROFILE_ID },
          }).$
        : EMPTY,
    [db],
  );

  const customGames = useRxQuery<CustomGameDoc[]>(
    customGamesQuery$,
    [],
  );
  const sessionDocs = useRxQuery<SavedGameConfigDoc[]>(
    savedGameConfigsQuery$,
    [],
  );

  const lastSessionConfigs = useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {};
    for (const d of sessionDocs) {
      if (isLastSessionConfigId(d.id)) map[d.gameId] = d.config;
    }
    return map;
  }, [sessionDocs]);

  const gameIdsWithCustomGames = useMemo(
    () => new Set(customGames.map((d) => d.gameId)),
    [customGames],
  );

  const getByGameId = (gameId: string): CustomGameDoc[] =>
    customGames.filter((d) => d.gameId === gameId);

  const save = async ({
    gameId,
    name,
    config,
    color,
    cover,
  }: SaveInput): Promise<string> => {
    if (!db) throw new Error('Database not ready');
    const trimmed = name.trim();
    const namesForGame = customGames
      .filter((d) => d.gameId === gameId)
      .map((d) => d.name);
    if (namesForGame.includes(trimmed)) {
      throw new Error(
        `A custom game named "${trimmed}" already exists for this game`,
      );
    }
    const doc: CustomGameDoc = {
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
    await db.custom_games.insert(doc);
    return doc.id;
  };

  const remove = async (id: string): Promise<void> => {
    if (!db) return;
    const doc = await db.custom_games.findOne(id).exec();
    if (doc) await doc.remove();
  };

  const rename = async (id: string, newName: string): Promise<void> => {
    if (!db) return;
    const doc = await db.custom_games.findOne(id).exec();
    if (!doc) return;
    const trimmed = newName.trim();
    const namesForGame = customGames
      .filter((d) => d.gameId === doc.gameId && d.id !== id)
      .map((d) => d.name);
    if (namesForGame.includes(trimmed)) {
      throw new Error(
        `A custom game named "${trimmed}" already exists for this game`,
      );
    }
    await doc.incrementalPatch({ name: trimmed });
  };

  const update = useCallback(
    async (
      id: string,
      config: Record<string, unknown>,
      name?: string,
      extras?: UpdateExtras,
    ): Promise<void> => {
      if (!db) return;
      const doc = await db.custom_games.findOne(id).exec();
      if (!doc) return;
      const patch: Partial<CustomGameDoc> = {
        // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone throws on functions; we want them silently dropped
        config: JSON.parse(JSON.stringify(config)) as Record<
          string,
          unknown
        >,
      };
      if (name !== undefined) {
        const trimmed = name.trim();
        const siblings = await db.custom_games
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
            `A custom game named "${trimmed}" already exists for this game`,
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
      const id = lastSessionConfigId(gameId);
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
    customGames,
    gameIdsWithCustomGames,
    getByGameId,
    lastSessionConfigs,
    save,
    remove,
    rename,
    update,
    persistLastSessionConfig,
  };
};
