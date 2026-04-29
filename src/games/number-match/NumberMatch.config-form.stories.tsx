// Co-located preview of the NumberMatch config form, driven by the real
// `numberMatchConfigFields` registry export and `NumberMatchSimpleConfigForm`
// for simple-mode preview.
//
// Pattern precedent: per-game `InstructionsOverlay` stories (PR #141).
import { useState } from 'react';
import { fn } from 'storybook/test';
import { NumberMatchSimpleConfigForm } from './NumberMatchSimpleConfigForm/NumberMatchSimpleConfigForm';
import { numberMatchConfigFields } from './types';
import type { Meta, StoryObj } from '@storybook/react';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';

type Mode = 'simple' | 'advanced';

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

const simpleBaseline: Record<string, unknown> = {
  configMode: 'simple',
  inputMethod: 'drag',
  mode: 'numeral-to-group',
  range: { min: 1, max: 10 },
  distractorCount: 3,
};

type HarnessProps = {
  mode: Mode;
  scenario: Scenario;
  onChange: (config: Record<string, unknown>) => void;
};

const NumberMatchConfigFormHarness = ({
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
      <NumberMatchSimpleConfigForm
        config={config}
        onChange={handleChange}
      />
    );
  }
  return (
    <ConfigFormFields
      fields={numberMatchConfigFields}
      config={config}
      onChange={handleChange}
    />
  );
};

const meta: Meta<typeof NumberMatchConfigFormHarness> = {
  title: 'Games/NumberMatch/ConfigForm',
  component: NumberMatchConfigFormHarness,
  tags: ['autodocs'],
  args: {
    mode: 'advanced',
    scenario: 'numeral-to-group',
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
        'numeral-to-group',
        'cardinal-to-ordinal',
        'with-distractors',
      ] satisfies Scenario[],
      description:
        'Advanced-mode preset covering NumberMatch modes: numeral↔group, cardinal↔ordinal, and a distractor-enabled config.',
      if: { arg: 'mode', eq: 'advanced' },
    },
    onChange: { table: { disable: true } },
  },
  render: ({ mode, scenario, onChange }) => (
    <NumberMatchConfigFormHarness
      key={`${mode}:${scenario}`}
      mode={mode}
      scenario={scenario}
      onChange={onChange}
    />
  ),
};
export default meta;

type Story = StoryObj<typeof NumberMatchConfigFormHarness>;

export const Playground: Story = {};
