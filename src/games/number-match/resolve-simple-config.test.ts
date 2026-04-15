import { describe, expect, it } from 'vitest';
import {
  advancedToSimple,
  resolveSimpleConfig,
} from './resolve-simple-config';

describe('NumberMatch resolveSimpleConfig', () => {
  it('maps a simple config to a full config', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      from: 'numeral',
      to: 'group',
      rangeMin: 1,
      rangeMax: 10,
      inputMethod: 'drag',
      distractorCount: 3,
    });
    expect(full.mode).toBe('numeral-to-group');
    expect(full.range).toEqual({ min: 1, max: 10 });
    expect(full.tileStyle).toBe('dots');
    expect(full.tileBankMode).toBe('distractors');
  });

  it('produces tileBankMode "exact" when distractorCount is 0', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      from: 'numeral',
      to: 'group',
      rangeMin: 1,
      rangeMax: 10,
      inputMethod: 'drag',
      distractorCount: 0,
    });
    expect(full.tileBankMode).toBe('exact');
  });

  it('round-trips via advancedToSimple', () => {
    const full = resolveSimpleConfig({
      configMode: 'simple',
      from: 'group',
      to: 'numeral',
      rangeMin: 2,
      rangeMax: 8,
      inputMethod: 'both',
      distractorCount: 2,
    });
    const back = advancedToSimple(full);
    expect(back.from).toBe('group');
    expect(back.to).toBe('numeral');
    expect(back.rangeMin).toBe(2);
    expect(back.rangeMax).toBe(8);
    expect(back.inputMethod).toBe('both');
    expect(back.distractorCount).toBe(2);
  });
});
