// Co-located preview of the WordSpell config form, driven by the real
// `wordSpellConfigFields` registry export.
//
// Pattern precedent: per-game `InstructionsOverlay` stories (PR #141).
import { useState } from 'react';
import { fn } from 'storybook/test';
import { wordSpellConfigFields } from './types';
import type { Meta, StoryObj } from '@storybook/react';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';

type Scenario = 'picture' | 'scramble' | 'sentence-gap';

const scenarios: Record<Scenario, Record<string, unknown>> = {
  picture: {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'exact',
    totalRounds: 5,
    mode: 'picture',
    tileUnit: 'letter',
    roundsInOrder: false,
    ttsEnabled: true,
  },
  scramble: {
    inputMethod: 'both',
    wrongTileBehavior: 'reject',
    tileBankMode: 'distractors',
    totalRounds: 6,
    mode: 'scramble',
    tileUnit: 'letter',
    roundsInOrder: true,
    ttsEnabled: false,
  },
  'sentence-gap': {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'distractors',
    totalRounds: 4,
    mode: 'sentence-gap',
    tileUnit: 'word',
    roundsInOrder: false,
    ttsEnabled: true,
  },
};

type HarnessProps = {
  scenario: Scenario;
  onChange: (config: Record<string, unknown>) => void;
};

const WordSpellConfigFormHarness = ({
  scenario,
  onChange,
}: HarnessProps): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>(
    () => scenarios[scenario],
  );
  return (
    <ConfigFormFields
      fields={wordSpellConfigFields}
      config={config}
      onChange={(next) => {
        setConfig(next);
        onChange(next);
      }}
    />
  );
};

const meta: Meta<typeof WordSpellConfigFormHarness> = {
  title: 'Games/WordSpell/ConfigForm',
  component: WordSpellConfigFormHarness,
  tags: ['autodocs'],
  args: {
    scenario: 'picture',
    onChange: fn(),
  },
  argTypes: {
    scenario: {
      control: { type: 'radio' },
      options: [
        'picture',
        'scramble',
        'sentence-gap',
      ] satisfies Scenario[],
      description:
        'Preset covering meaningful WordSpell modes: picture (letters), scramble (letters with distractors), sentence-gap (word tiles).',
    },
    onChange: { control: false },
  },
  render: ({ scenario, onChange }) => (
    <WordSpellConfigFormHarness
      key={scenario}
      scenario={scenario}
      onChange={onChange}
    />
  ),
};
export default meta;

type Story = StoryObj<typeof WordSpellConfigFormHarness>;

export const Playground: Story = {};
