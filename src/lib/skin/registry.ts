import { classicSkin } from './classic-skin';
import type { GameSkin } from './game-skin';
import type { NumberMatchSkinId } from '@/games/number-match/types';
import type { SortNumbersSkinId } from '@/games/sort-numbers/types';
import type { WordSpellSkinId } from '@/games/word-spell/types';

/**
 * Maps each game id to the union of skin ids it accepts. New games join the
 * registry by adding an entry here (and exporting a `<Game>SkinId` union
 * from their `types.ts`).
 *
 * `spot-all` is included as a typing-only entry so `registerSkin('spot-all',
 * …)` type-checks; `SpotAllConfig` itself does not yet carry a `skin?` field
 * — adding that is a follow-up.
 */
export interface GameSkinIdMap {
  'word-spell': WordSpellSkinId;
  'number-match': NumberMatchSkinId;
  'sort-numbers': SortNumbersSkinId;
  'spot-all': 'classic';
}

const registry = new Map<string, Map<string, GameSkin>>();

/** Register a skin for a specific game. Overrides existing entry with the same id. */
export function registerSkin<TGame extends keyof GameSkinIdMap>(
  gameId: TGame,
  skin: GameSkin & { id: GameSkinIdMap[TGame] },
): void {
  let gameSkins = registry.get(gameId);
  if (!gameSkins) {
    gameSkins = new Map();
    registry.set(gameId, gameSkins);
  }
  gameSkins.set(skin.id, skin);
}

/** All registered skins for a game, with the classic skin always included first. */
export function getRegisteredSkins<TGame extends keyof GameSkinIdMap>(
  gameId: TGame,
): Array<GameSkin & { id: GameSkinIdMap[TGame] }> {
  const gameSkins = registry.get(gameId);
  if (!gameSkins)
    return [classicSkin] as Array<
      GameSkin & { id: GameSkinIdMap[TGame] }
    >;
  const others = [...gameSkins.values()].filter(
    (s) => s.id !== 'classic',
  );
  return [classicSkin, ...others] as Array<
    GameSkin & { id: GameSkinIdMap[TGame] }
  >;
}

/** Resolve a skin by id, falling back to `classic` when unknown. */
export function resolveSkin(gameId: string, skinId?: string): GameSkin {
  if (!skinId || skinId === 'classic') return classicSkin;
  const gameSkins = registry.get(gameId);
  return gameSkins?.get(skinId) ?? classicSkin;
}

/** Test-only hook to reset the registry between tests. */
export function __resetSkinRegistryForTests(): void {
  registry.clear();
}
