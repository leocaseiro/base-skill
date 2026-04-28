// Co-located preview of the SortNumbers config form, driven by the real
// `sortNumbersConfigFields` registry export. The generic
// `src/components/ConfigFormFields.stories.tsx` covers abstract rendering
// branches; this story shows what a real game's form looks like end-to-end.
//
// Pattern precedent: per-game `InstructionsOverlay` stories (PR #141).
import { useState } from 'react';
import { fn } from 'storybook/test';
import { sortNumbersConfigFields } from './types';
import type { Meta, StoryObj } from '@storybook/react';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';

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

type HarnessProps = {
  scenario: Scenario;
  onChange: (config: Record<string, unknown>) => void;
};

const SortNumbersConfigFormHarness = ({
  scenario,
  onChange,
}: HarnessProps): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>(
    () => scenarios[scenario],
  );
  return (
    <ConfigFormFields
      fields={sortNumbersConfigFields}
      config={config}
      onChange={(next) => {
        setConfig(next);
        onChange(next);
      }}
    />
  );
};

const meta: Meta<typeof SortNumbersConfigFormHarness> = {
  title: 'Games/SortNumbers/ConfigForm',
  component: SortNumbersConfigFormHarness,
  tags: ['autodocs'],
  args: {
    scenario: 'random',
    onChange: fn(),
  },
  argTypes: {
    scenario: {
      control: { type: 'radio' },
      options: [
        'random',
        'by-mode',
        'distractors',
      ] satisfies Scenario[],
      description:
        'Preset matching SortNumbers config branches: random skip, by-mode skip (shows step + start), or distractor tile bank (shows source + count).',
    },
    onChange: { control: false },
  },
  render: ({ scenario, onChange }) => (
    <SortNumbersConfigFormHarness
      key={scenario}
      scenario={scenario}
      onChange={onChange}
    />
  ),
};
export default meta;

type Story = StoryObj<typeof SortNumbersConfigFormHarness>;

export const Playground: Story = {};
