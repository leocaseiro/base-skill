import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { EMPTY } from 'rxjs';
import { useRxDB } from './useRxDB';
import { useRxQuery } from './useRxQuery';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';

const ANONYMOUS_PROFILE_ID = 'anonymous';

type SaveInput = {
  gameId: string;
  name: string;
  config: Record<string, unknown>;
};

type UseSavedConfigsResult = {
  savedConfigs: SavedGameConfigDoc[];
  gameIdsWithConfigs: Set<string>;
  getByGameId: (gameId: string) => SavedGameConfigDoc[];
  save: (input: SaveInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
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

  const gameIdsWithConfigs = useMemo(
    () => new Set(docs.map((d) => d.gameId)),
    [docs],
  );

  const getByGameId = (gameId: string): SavedGameConfigDoc[] =>
    docs.filter((d) => d.gameId === gameId);

  const save = async ({
    gameId,
    name,
    config,
  }: SaveInput): Promise<void> => {
    if (!db) return;
    const trimmed = name.trim();
    const namesForGame = docs
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
      config,
      createdAt: new Date().toISOString(),
    };
    await db.saved_game_configs.insert(doc);
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
    const namesForGame = docs
      .filter((d) => d.gameId === doc.gameId && d.id !== id)
      .map((d) => d.name);
    if (namesForGame.includes(trimmed)) {
      throw new Error(
        `A saved config named "${trimmed}" already exists for this game`,
      );
    }
    await doc.incrementalPatch({ name: trimmed });
  };

  return {
    savedConfigs: docs,
    gameIdsWithConfigs,
    getByGameId,
    save,
    remove,
    rename,
  };
};
