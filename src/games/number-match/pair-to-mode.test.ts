import { describe, expect, it } from 'vitest';
import { pairToMode, validToValues } from './pair-to-mode';

describe('pairToMode', () => {
  it('maps numeral → group', () => {
    expect(pairToMode('numeral', 'group')).toBe('numeral-to-group');
  });

  it('maps group → numeral', () => {
    expect(pairToMode('group', 'numeral')).toBe('group-to-numeral');
  });

  it('maps numeral → word (cardinal number → text)', () => {
    expect(pairToMode('numeral', 'word')).toBe(
      'cardinal-number-to-text',
    );
  });

  it('maps word → numeral', () => {
    expect(pairToMode('word', 'numeral')).toBe(
      'cardinal-text-to-number',
    );
  });

  it('maps numeral → ordinal and back', () => {
    expect(pairToMode('numeral', 'ordinal')).toBe(
      'cardinal-to-ordinal',
    );
    expect(pairToMode('ordinal', 'numeral')).toBe(
      'ordinal-to-cardinal',
    );
  });

  it('throws on invalid pairs', () => {
    expect(() => pairToMode('numeral', 'numeral')).toThrow();
  });
});

describe('validToValues', () => {
  it('lists all valid "to" choices for a given "from"', () => {
    expect(validToValues('numeral')).toEqual([
      'group',
      'word',
      'ordinal',
    ]);
    expect(validToValues('group')).toEqual(['numeral']);
  });
});
