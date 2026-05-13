import { describe, expectTypeOf, it } from 'vitest';
import type { WordSpellConfig, WordSpellSkinId } from './types';

describe('WordSpellConfig skin narrowing', () => {
  it('narrows skin to WordSpellSkinId on the WordSpell config', () => {
    const cfg = {} as WordSpellConfig;
    expectTypeOf(cfg.skin).toEqualTypeOf<WordSpellSkinId | undefined>();
  });

  it('accepts both classic and dragon-cave', () => {
    expectTypeOf<'classic'>().toMatchTypeOf<WordSpellSkinId>();
    expectTypeOf<'dragon-cave'>().toMatchTypeOf<WordSpellSkinId>();
  });
});
