// src/lib/app-paths.test.ts
import { describe, expect, it } from 'vitest';
import {
  isAppGameSessionPath,
  shouldRenderAppHeaderFooter,
} from './app-paths';

describe('isAppGameSessionPath', () => {
  it('is true for /$locale/game/$gameId', () => {
    expect(isAppGameSessionPath('/en/game/word-spell')).toBe(true);
    expect(isAppGameSessionPath('/pt-BR/game/number-match')).toBe(true);
  });

  it('is false when not a game session (including legacy /_app/ in pathname)', () => {
    expect(isAppGameSessionPath('/en/')).toBe(false);
    expect(isAppGameSessionPath('/en')).toBe(false);
    expect(isAppGameSessionPath('/en/_app/game/word-spell')).toBe(
      false,
    );
  });
});

describe('shouldRenderAppHeaderFooter', () => {
  it('is false in-game so global header and footer are hidden (fullscreen)', () => {
    expect(shouldRenderAppHeaderFooter('/en/game/word-spell')).toBe(
      false,
    );
  });

  it('is true for home, settings, and other non-game routes', () => {
    expect(shouldRenderAppHeaderFooter('/en/')).toBe(true);
    expect(shouldRenderAppHeaderFooter('/en/settings')).toBe(true);
  });
});
