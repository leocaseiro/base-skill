import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { resolveSimpleConfig } from '../resolve-simple-config';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import type { LevelGraphemeUnit } from '@/data/words';
import { GRAPHEMES_BY_LEVEL, filterWords } from '@/data/words';

const L1 = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];

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
    it(`level ${level}: toggling its row produces ≥ 1 hit`, async () => {
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
        await user.click(screen.getByLabelText(`Level ${level}`));
      }

      const simple = captured as {
        configMode: 'simple';
        selectedUnits: LevelGraphemeUnit[];
        region: 'aus';
        inputMethod: 'drag';
      };
      const resolved = resolveSimpleConfig(simple);
      const result = await filterWords(resolved.source.filter);
      expect(result.hits.length).toBeGreaterThan(0);
    });
  }
});
