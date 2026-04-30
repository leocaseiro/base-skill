import { useState } from 'react';
import { fn } from 'storybook/test';
import { resolveSimpleConfig } from './resolve-simple-config';
import { SpotAllConfigForm } from './SpotAllConfigForm/SpotAllConfigForm';
import { spotAllConfigFields } from './types';
import type { Meta, StoryObj } from '@storybook/react';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';

type Mode = 'simple' | 'advanced';

type HarnessProps = {
  mode: Mode;
  onChange: (config: Record<string, unknown>) => void;
};

const simpleBaseline = resolveSimpleConfig({
  configMode: 'simple',
  selectedConfusablePairs: [
    { pair: ['b', 'd'], type: 'mirror-horizontal' },
    { pair: ['p', 'q'], type: 'mirror-horizontal' },
  ],
  selectedReversibleChars: [],
}) as unknown as Record<string, unknown>;

const SpotAllConfigFormHarness = ({
  mode,
  onChange,
}: HarnessProps): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>(
    () => simpleBaseline,
  );
  const handleChange = (next: Record<string, unknown>): void => {
    setConfig(next);
    onChange(next);
  };
  if (mode === 'simple') {
    return (
      <SpotAllConfigForm config={config} onChange={handleChange} />
    );
  }
  return (
    <ConfigFormFields
      fields={spotAllConfigFields}
      config={config}
      onChange={handleChange}
    />
  );
};

const meta: Meta<typeof SpotAllConfigFormHarness> = {
  title: 'Games/SpotAll/ConfigForm',
  component: SpotAllConfigFormHarness,
  tags: ['autodocs'],
  args: {
    mode: 'simple',
    onChange: fn(),
  },
  argTypes: {
    mode: {
      control: { type: 'radio' },
      options: ['simple', 'advanced'] satisfies Mode[],
      description:
        'Which form variant to preview: the grouped-picker Simple form or the full Advanced field list.',
    },
    onChange: { table: { disable: true } },
  },
  render: ({ mode, onChange }) => (
    <SpotAllConfigFormHarness
      key={mode}
      mode={mode}
      onChange={onChange}
    />
  ),
};
export default meta;

type Story = StoryObj<typeof SpotAllConfigFormHarness>;

export const Playground: Story = {};
