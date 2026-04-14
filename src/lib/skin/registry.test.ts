import { beforeEach, describe, expect, it } from 'vitest';
import { classicSkin } from './classic-skin';
import {
  __resetSkinRegistryForTests,
  getRegisteredSkins,
  registerSkin,
  resolveSkin,
} from './registry';
import type { GameSkin } from './game-skin';

const dinoEggsSkin: GameSkin = {
  id: 'dino-eggs',
  name: 'Dino Eggs',
  tokens: { '--skin-tile-bg': '#fbbf24' },
};

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
    const first: GameSkin = { id: 'test', name: 'First', tokens: {} };
    const second: GameSkin = { id: 'test', name: 'Second', tokens: {} };
    registerSkin('sort-numbers', first);
    registerSkin('sort-numbers', second);
    expect(resolveSkin('sort-numbers', 'test')).toBe(second);
  });
});
