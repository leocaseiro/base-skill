// Co-located preview of the NumberMatch config form, driven by the real
// `numberMatchConfigFields` registry export.
//
// Pattern precedent: per-game `InstructionsOverlay` stories (PR #141).
import { useState } from 'react';
import { fn } from 'storybook/test';
import { numberMatchConfigFields } from './types';
import type { Meta, StoryObj } from '@storybook/react';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';

type Scenario =
  | 'numeral-to-group'
  | 'cardinal-to-ordinal'
  | 'with-distractors';

const scenarios: Record<Scenario, Record<string, unknown>> = {
  'numeral-to-group': {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    mode: 'numeral-to-group',
    tileStyle: 'dots',
    tileBankMode: 'exact',
    distractorCount: 3,
    totalRounds: 5,
    roundsInOrder: false,
    range: { min: 1, max: 10 },
    ttsEnabled: false,
  },
  'cardinal-to-ordinal': {
    inputMethod: 'both',
    wrongTileBehavior: 'reject',
    mode: 'cardinal-to-ordinal',
    tileStyle: 'objects',
    tileBankMode: 'exact',
    distractorCount: 3,
    totalRounds: 8,
    roundsInOrder: true,
    range: { min: 1, max: 20 },
    ttsEnabled: true,
  },
  'with-distractors': {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    mode: 'group-to-numeral',
    tileStyle: 'fingers',
    tileBankMode: 'distractors',
    distractorCount: 5,
    totalRounds: 10,
    roundsInOrder: false,
    range: { min: 1, max: 10 },
    ttsEnabled: true,
  },
};

type HarnessProps = {
  scenario: Scenario;
  onChange: (config: Record<string, unknown>) => void;
};

const NumberMatchConfigFormHarness = ({
  scenario,
  onChange,
}: HarnessProps): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>(
    () => scenarios[scenario],
  );
  return (
    <ConfigFormFields
      fields={numberMatchConfigFields}
      config={config}
      onChange={(next) => {
        setConfig(next);
        onChange(next);
      }}
    />
  );
};

const meta: Meta<typeof NumberMatchConfigFormHarness> = {
  title: 'Games/NumberMatch/ConfigForm',
  component: NumberMatchConfigFormHarness,
  tags: ['autodocs'],
  args: {
    scenario: 'numeral-to-group',
    onChange: fn(),
  },
  argTypes: {
    scenario: {
      control: { type: 'radio' },
      options: [
        'numeral-to-group',
        'cardinal-to-ordinal',
        'with-distractors',
      ] satisfies Scenario[],
      description:
        'Preset covering NumberMatch modes: numeral↔group, cardinal↔ordinal, and a distractor-enabled config.',
    },
    onChange: { control: false },
  },
  render: ({ scenario, onChange }) => (
    <NumberMatchConfigFormHarness
      key={scenario}
      scenario={scenario}
      onChange={onChange}
    />
  ),
};
export default meta;

type Story = StoryObj<typeof NumberMatchConfigFormHarness>;

export const Playground: Story = {};
