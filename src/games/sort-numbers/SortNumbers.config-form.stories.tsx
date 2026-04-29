// Co-located preview of the SortNumbers config form, driven by the real
// `sortNumbersConfigFields` registry export and `SortNumbersSimpleConfigForm`
// for simple-mode preview. The generic
// `src/components/ConfigFormFields.stories.tsx` covers abstract rendering
// branches; this story shows what a real game's form looks like end-to-end.
//
// Pattern precedent: per-game `InstructionsOverlay` stories (PR #141).
import { useState } from 'react';
import { fn } from 'storybook/test';
import { SortNumbersSimpleConfigForm } from './SortNumbersSimpleConfigForm/SortNumbersSimpleConfigForm';
import { sortNumbersConfigFields } from './types';
import type { Meta, StoryObj } from '@storybook/react';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';

type Mode = 'simple' | 'advanced';

type Scenario = 'random' | 'by-mode' | 'distractors';

const scenarios: Record<Scenario, Record<string, unknown>> = {
  random: {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'exact',
    totalRounds: 3,
    roundsInOrder: false,
    direction: 'ascending',
    quantity: 4,
    range: { min: 2, max: 20 },
    skip: { mode: 'random' },
    distractors: { source: 'random', count: 2 },
    ttsEnabled: false,
  },
  'by-mode': {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'exact',
    totalRounds: 3,
    roundsInOrder: false,
    direction: 'ascending',
    quantity: 4,
    range: { min: 2, max: 50 },
    skip: { mode: 'by', step: 5, start: 'range-min' },
    distractors: { source: 'random', count: 2 },
    ttsEnabled: false,
  },
  distractors: {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'distractors',
    totalRounds: 3,
    roundsInOrder: false,
    direction: 'ascending',
    quantity: 4,
    range: { min: 2, max: 20 },
    skip: { mode: 'random' },
    distractors: { source: 'gaps-only', count: 3 },
    ttsEnabled: false,
  },
};

const simpleBaseline: Record<string, unknown> = {
  configMode: 'simple',
  inputMethod: 'drag',
  direction: 'ascending',
  quantity: 5,
  skip: { mode: 'by', step: 2, start: 2 },
  distractors: false,
};

type HarnessProps = {
  mode: Mode;
  scenario: Scenario;
  onChange: (config: Record<string, unknown>) => void;
};

const SortNumbersConfigFormHarness = ({
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
      <SortNumbersSimpleConfigForm
        config={config}
        onChange={handleChange}
      />
    );
  }
  return (
    <ConfigFormFields
      fields={sortNumbersConfigFields}
      config={config}
      onChange={handleChange}
    />
  );
};

const meta: Meta<typeof SortNumbersConfigFormHarness> = {
  title: 'Games/SortNumbers/ConfigForm',
  component: SortNumbersConfigFormHarness,
  tags: ['autodocs'],
  args: {
    mode: 'advanced',
    scenario: 'random',
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
        'random',
        'by-mode',
        'distractors',
      ] satisfies Scenario[],
      description:
        'Advanced-mode preset matching SortNumbers config branches: random skip, by-mode skip (shows step + start), or distractor tile bank (shows source + count).',
      if: { arg: 'mode', eq: 'advanced' },
    },
    onChange: { table: { disable: true } },
  },
  render: ({ mode, scenario, onChange }) => (
    <SortNumbersConfigFormHarness
      key={`${mode}:${scenario}`}
      mode={mode}
      scenario={scenario}
      onChange={onChange}
    />
  ),
};
export default meta;

type Story = StoryObj<typeof SortNumbersConfigFormHarness>;

export const Playground: Story = {};
