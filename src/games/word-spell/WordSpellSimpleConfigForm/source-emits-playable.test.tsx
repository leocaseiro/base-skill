import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import { filterWords } from '@/data/words';

type SourceConfig = {
  source?: {
    type: 'word-library';
    filter: {
      region: string;
      level: number;
      phonemesAllowed?: string[];
    };
  };
};

const Harness = ({
  initialLevel,
  onConfigRef,
}: {
  initialLevel: number;
  onConfigRef: (cfg: Record<string, unknown>) => void;
}) => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    source: {
      type: 'word-library',
      filter: {
        region: 'aus',
        level: initialLevel,
        phonemesAllowed: [],
      },
    },
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
    it(`level ${level}: switching to it produces ≥ 1 hit`, async () => {
      const user = userEvent.setup();
      let captured: Record<string, unknown> = {};
      render(
        <Harness
          initialLevel={1}
          onConfigRef={(c) => {
            captured = c;
          }}
        />,
      );

      // Pick the target level via the level select
      await user.selectOptions(
        screen.getByLabelText(/level/i),
        String(level),
      );

      const source = captured.source as SourceConfig['source'];
      expect(source).toBeDefined();
      const result = await filterWords(source!.filter);
      expect(result.hits.length).toBeGreaterThan(0);
    });
  }
});
