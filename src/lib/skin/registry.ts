import { classicSkin } from './classic-skin';
import type { GameSkin } from './game-skin';

const registry = new Map<string, Map<string, GameSkin>>();

/** Register a skin for a specific game. Overrides existing entry with the same id. */
export function registerSkin(gameId: string, skin: GameSkin): void {
  let gameSkins = registry.get(gameId);
  if (!gameSkins) {
    gameSkins = new Map();
    registry.set(gameId, gameSkins);
  }
  gameSkins.set(skin.id, skin);
}

/** All registered skins for a game, with the classic skin always included first. */
export function getRegisteredSkins(gameId: string): GameSkin[] {
  const gameSkins = registry.get(gameId);
  if (!gameSkins) return [classicSkin];
  const others = [...gameSkins.values()].filter(
    (s) => s.id !== 'classic',
  );
  return [classicSkin, ...others];
}

/** Resolve a skin by id, falling back to `classic` when unknown. */
export function resolveSkin(
  gameId: string,
  skinId: string | undefined,
): GameSkin {
  if (!skinId || skinId === 'classic') return classicSkin;
  const gameSkins = registry.get(gameId);
  return gameSkins?.get(skinId) ?? classicSkin;
}

/** Test-only hook to reset the registry between tests. */
export function __resetSkinRegistryForTests(): void {
  registry.clear();
}
