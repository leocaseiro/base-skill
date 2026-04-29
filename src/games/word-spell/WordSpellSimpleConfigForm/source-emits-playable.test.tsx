import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveSimpleConfig } from '../resolve-simple-config';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import type { LevelGraphemeUnit } from '@/data/words';
import type { JSX } from 'react';
import {
  GRAPHEMES_BY_LEVEL,
  __resetChunkCacheForTests,
  filterWords,
} from '@/data/words';

const L1 = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];

afterEach(() => {
  __resetChunkCacheForTests();
});

const Harness = ({
  initial,
  onConfigRef,
}: {
  initial: LevelGraphemeUnit[];
  onConfigRef: (cfg: Record<string, unknown>) => void;
}): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    selectedUnits: initial,
    region: 'aus',
    inputMethod: 'drag',
  });
  onConfigRef(config);
  return (
    <WordSpellSimpleConfigForm
      config={config}
      onChange={(next) => {
        setConfig(next);
        onConfigRef(next);
      }}
    />
  );
};

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

describe('Simple form emits playable source for every level', () => {
  for (const level of LEVELS) {
    it(`level ${level}: clicking its header produces ≥ 1 hit`, async () => {
      const user = userEvent.setup();
      let captured: Record<string, unknown> = {};
      render(
        <Harness
          initial={L1}
          onConfigRef={(c) => {
            captured = c;
          }}
        />,
      );

      if (level !== 1) {
        await user.click(
          screen.getByRole('button', {
            name: new RegExp(`Level ${level}`),
          }),
        );
      }

      const simple = captured as {
        configMode: 'simple';
        selectedUnits: LevelGraphemeUnit[];
        region: 'aus';
        inputMethod: 'drag';
      };
      const resolved = resolveSimpleConfig(simple);
      const result = await filterWords(resolved.source!.filter);
      expect(result.hits.length).toBeGreaterThan(0);
    });
  }
});

describe('Simple form supports single-chip selections (cumulative graphemes regression)', () => {
  it('L4 + only sh → ≥ 4 hits (ship/shop/shed/fish/dish/...)', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> = {};
    render(
      <Harness
        initial={[]}
        onConfigRef={(c) => {
          captured = c;
        }}
      />,
    );

    const shChip = await screen.findByRole('button', {
      name: /^sh \/ʃ\//i,
    });
    await user.click(shChip);

    const simple = captured as {
      configMode: 'simple';
      selectedUnits: LevelGraphemeUnit[];
      region: 'aus';
      inputMethod: 'drag';
    };
    expect(simple.selectedUnits).toEqual([{ g: 'sh', p: 'ʃ' }]);

    const resolved = resolveSimpleConfig(simple);
    expect(resolved.source!.filter.graphemesRequired).toEqual([
      { g: 'sh', p: 'ʃ' },
    ]);

    const result = await filterWords(resolved.source!.filter);
    expect(result.hits.length).toBeGreaterThanOrEqual(4);
    expect(result.hits.some((h) => h.word === 'ship')).toBe(true);
  });

  it('L3 review (all L3 chips) drops easy L1/L2 words', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> = {};
    render(
      <Harness
        initial={[]}
        onConfigRef={(c) => {
          captured = c;
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Level 3/i }));

    const simple = captured as {
      configMode: 'simple';
      selectedUnits: LevelGraphemeUnit[];
      region: 'aus';
      inputMethod: 'drag';
    };
    const resolved = resolveSimpleConfig(simple);
    const result = await filterWords(resolved.source!.filter);

    // Words that don't use any L3 phoneme should NOT be in the result
    expect(result.hits.some((h) => h.word === 'sit')).toBe(false);
    expect(result.hits.some((h) => h.word === 'mad')).toBe(false);
    // Words that do use an L3 phoneme should be in the result
    expect(result.hits.some((h) => h.word === 'bat')).toBe(true);
  });
});
