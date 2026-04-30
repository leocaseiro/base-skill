import { describe, expect, it } from 'vitest';
import { CONFUSABLE_GROUPS } from './confusable-pair-groups';
import type { ConfusableGroup } from './confusable-pair-groups';

describe('CONFUSABLE_GROUPS', () => {
  it('has 6 groups in spec order', () => {
    expect(CONFUSABLE_GROUPS.map((g) => g.id)).toEqual([
      'mirror-horizontal',
      'mirror-vertical',
      'rotation-180',
      'visual-similarity',
      'transposition',
      'reversible',
    ]);
  });

  it('mirror-horizontal includes b↔d and p↔q', () => {
    const group = byId('mirror-horizontal');
    expect(
      group.chips.some(
        (c) =>
          c.kind === 'pair' && c.pair[0] === 'b' && c.pair[1] === 'd',
      ),
    ).toBe(true);
    expect(
      group.chips.some(
        (c) =>
          c.kind === 'pair' && c.pair[0] === 'p' && c.pair[1] === 'q',
      ),
    ).toBe(true);
  });

  it('visual-similarity includes the 3-way I, l, 1 chip', () => {
    const group = byId('visual-similarity');
    const triple = group.chips.find((c) => c.kind === 'tripleSet');
    expect(triple).toBeDefined();
    expect(triple?.kind === 'tripleSet' && triple.members).toEqual([
      'I',
      'l',
      '1',
    ]);
  });

  it('reversible group has 9 chips (one per R5b char)', () => {
    const group = byId('reversible');
    expect(group.chips).toHaveLength(9);
    expect(group.chips.every((c) => c.kind === 'reversible')).toBe(
      true,
    );
  });
});

const byId = (id: string): ConfusableGroup => {
  const g = CONFUSABLE_GROUPS.find((gg) => gg.id === id);
  if (!g) throw new Error(`group ${id} missing`);
  return g;
};
