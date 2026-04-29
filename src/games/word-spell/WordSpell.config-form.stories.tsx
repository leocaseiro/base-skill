// Co-located preview of the WordSpell config form, driven by the real
// `wordSpellConfigFields` registry export and `WordSpellSimpleConfigForm`
// for simple-mode preview.
//
// Pattern precedent: per-game `InstructionsOverlay` stories (PR #141).
import { useState } from 'react';
import { fn } from 'storybook/test';
import { wordSpellConfigFields } from './types';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm/WordSpellSimpleConfigForm';
import type { Meta, StoryObj } from '@storybook/react';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';

type Mode = 'simple' | 'advanced';

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

const simpleBaseline: Record<string, unknown> = {
  configMode: 'simple',
  inputMethod: 'drag',
  level: 1,
  phonemesAllowed: [],
};

type HarnessProps = {
  mode: Mode;
  scenario: Scenario;
  onChange: (config: Record<string, unknown>) => void;
};

const WordSpellConfigFormHarness = ({
  mode,
  scenario,
  onChange,
}: HarnessProps): JSX.Element => {
  const initial =
    mode === 'simple' ? simpleBaseline : scenarios[scenario];
  const [config, setConfig] = useState<Record<string, unknown>>(
    () => initial,
  );
  const handleChange = (next: Record<string, unknown>): void => {
    setConfig(next);
    onChange(next);
  };
  if (mode === 'simple') {
    return (
      <WordSpellSimpleConfigForm
        config={config}
        onChange={handleChange}
      />
    );
  }
  return (
    <ConfigFormFields
      fields={wordSpellConfigFields}
      config={config}
      onChange={handleChange}
    />
  );
};

const meta: Meta<typeof WordSpellConfigFormHarness> = {
  title: 'Games/WordSpell/ConfigForm',
  component: WordSpellConfigFormHarness,
  tags: ['autodocs'],
  args: {
    mode: 'advanced',
    scenario: 'picture',
    onChange: fn(),
  },
  argTypes: {
    mode: {
      control: { type: 'radio' },
      options: ['simple', 'advanced'] satisfies Mode[],
      description:
        'Which form variant to preview: the kid-friendly Simple form or the full Advanced field list.',
    },
    scenario: {
      control: { type: 'radio' },
      options: [
        'picture',
        'scramble',
        'sentence-gap',
      ] satisfies Scenario[],
      description:
        'Advanced-mode preset covering meaningful WordSpell modes: picture (letters), scramble (letters with distractors), sentence-gap (word tiles).',
      if: { arg: 'mode', eq: 'advanced' },
    },
    onChange: { table: { disable: true } },
  },
  render: ({ mode, scenario, onChange }) => (
    <WordSpellConfigFormHarness
      key={`${mode}:${scenario}`}
      mode={mode}
      scenario={scenario}
      onChange={onChange}
    />
  ),
};
export default meta;

type Story = StoryObj<typeof WordSpellConfigFormHarness>;

export const Playground: Story = {};
