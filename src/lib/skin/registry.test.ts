import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { classicSkin } from './classic-skin';
import {
  __resetSkinRegistryForTests,
  getRegisteredSkins,
  registerSkin,
  resolveSkin,
} from './registry';
import type { GameSkin } from './game-skin';
import type { WordSpellSkinId } from '@/games/word-spell/types';

// The runtime tests below register placeholder skins under games whose
// SkinId unions don't yet include them ('dino-eggs', 'test'). We cast at
// the test boundary because the goal here is to exercise the Map's runtime
// behavior, not the call-site narrowing — the type-level guarantees are
// covered by the `registerSkin — generic signature` block at the bottom.
const dinoEggsSkin = {
  id: 'dino-eggs',
  name: 'Dino Eggs',
  tokens: { '--skin-tile-bg': '#fbbf24' },
} as unknown as GameSkin & { id: 'classic' };

describe('skin registry', () => {
  beforeEach(() => {
    __resetSkinRegistryForTests();
  });

  it('registers a skin and resolves it by id', () => {
    registerSkin('sort-numbers', dinoEggsSkin);
    expect(resolveSkin('sort-numbers', 'dino-eggs')).toBe(dinoEggsSkin);
  });

  it('resolveSkin falls back to classic when the id is unknown', () => {
    expect(resolveSkin('sort-numbers', 'missing')).toBe(classicSkin);
  });

  it('resolveSkin falls back to classic when the id is undefined', () => {
    expect(resolveSkin('sort-numbers')).toBe(classicSkin);
  });

  it('resolveSkin returns classic for games with no registered skins', () => {
    expect(resolveSkin('never-registered', 'anything')).toBe(
      classicSkin,
    );
  });

  it('getRegisteredSkins returns [classic] when nothing is registered for a game', () => {
    expect(getRegisteredSkins('sort-numbers')).toEqual([classicSkin]);
  });

  it('getRegisteredSkins returns classic plus any registered skins', () => {
    registerSkin('sort-numbers', dinoEggsSkin);
    const skins = getRegisteredSkins('sort-numbers');
    expect(skins).toContain(classicSkin);
    expect(skins).toContain(dinoEggsSkin);
  });

  it('isolates skins between games', () => {
    registerSkin('sort-numbers', dinoEggsSkin);
    expect(getRegisteredSkins('word-spell')).toEqual([classicSkin]);
  });

  it('overrides an existing registration with the same id', () => {
    const first = {
      id: 'test',
      name: 'First',
      tokens: {},
    } as unknown as GameSkin & { id: 'classic' };
    const second = {
      id: 'test',
      name: 'Second',
      tokens: {},
    } as unknown as GameSkin & { id: 'classic' };
    registerSkin('sort-numbers', first);
    registerSkin('sort-numbers', second);
    expect(resolveSkin('sort-numbers', 'test')).toBe(second);
  });
});

describe('registerSkin — generic signature', () => {
  beforeEach(() => {
    __resetSkinRegistryForTests();
  });

  it("only accepts skin ids that match the game's SkinId union", () => {
    // Compile-time check via expectTypeOf — narrows the call signature.
    type Args = Parameters<typeof registerSkin<'word-spell'>>[1];
    expectTypeOf<Args['id']>().toEqualTypeOf<WordSpellSkinId>();
  });

  it("narrows spot-all registrations to 'classic'", () => {
    type Args = Parameters<typeof registerSkin<'spot-all'>>[1];
    expectTypeOf<Args['id']>().toEqualTypeOf<'classic'>();
  });

  it('getRegisteredSkins narrows the returned id type per-game', () => {
    type Result = ReturnType<typeof getRegisteredSkins<'word-spell'>>;
    expectTypeOf<
      Result[number]['id']
    >().toEqualTypeOf<WordSpellSkinId>();
  });

  it('lockstep: registers + retrieves a word-spell skin', () => {
    const dragonCave = {
      id: 'dragon-cave',
      name: 'Dragon Cave',
      tokens: {},
    } as const satisfies GameSkin & { id: WordSpellSkinId };
    registerSkin('word-spell', dragonCave);
    const ids = getRegisteredSkins('word-spell').map((s) => s.id);
    expect(ids).toContain('classic');
    expect(ids).toContain('dragon-cave');
  });
});
