import { describe, expect, it } from 'vitest';
import {
  advancedToSimple,
  resolveSimpleConfig,
} from './resolve-simple-config';

describe('WordSpell resolveSimpleConfig', () => {
  it('builds a word-library source from simple fields', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      level: 2,
      phonemesAllowed: ['m', 'd', 'g'],
      inputMethod: 'drag',
    });
    expect(full.source).toEqual({
      type: 'word-library',
      filter: {
        region: 'aus',
        level: 2,
        phonemesAllowed: ['m', 'd', 'g'],
      },
    });
    expect(full.mode).toBe('scramble');
    expect(full.inputMethod).toBe('drag');
  });

  it('round-trips via advancedToSimple', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      level: 3,
      phonemesAllowed: ['k', 'ck'],
      inputMethod: 'type',
    });
    const back = advancedToSimple(full);
    expect(back.level).toBe(3);
    expect(back.phonemesAllowed).toEqual(['k', 'ck']);
    expect(back.inputMethod).toBe('type');
  });
});
