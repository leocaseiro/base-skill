import { fn } from 'storybook/test';

import { ConfigFormFields } from './ConfigFormFields';
import type { ConfigField } from '@/lib/config-fields';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

type Scenario =
  | 'primitive-types'
  | 'nested-types'
  | 'nested-select-or-number'
  | 'visible-when-hidden'
  | 'visible-when-shown';

interface StoryArgs {
  scenario: Scenario;
  onChange: (config: Record<string, unknown>) => void;
  // Shadowed raw props — driven by scenario; hidden from Controls.
  fields?: never;
  config?: never;
}

// Generic fixtures — one per rendering branch of ConfigFormFields.tsx.
const primitiveFields: ConfigField[] = [
  {
    type: 'select',
    key: 'size',
    label: 'Size',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  },
  {
    type: 'number',
    key: 'count',
    label: 'Count',
    min: 1,
    max: 20,
  },
  {
    type: 'checkbox',
    key: 'enabled',
    label: 'Enabled',
  },
];

const nestedFields: ConfigField[] = [
  {
    type: 'nested-select',
    key: 'group',
    subKey: 'mode',
    label: 'Group mode',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'manual', label: 'Manual' },
    ],
  },
  {
    type: 'nested-number',
    key: 'group',
    subKey: 'size',
    label: 'Group size',
    min: 1,
    max: 10,
  },
];

const selectOrNumberFields: ConfigField[] = [
  {
    type: 'nested-select-or-number',
    key: 'range',
    subKey: 'max',
    label: 'Max range',
    min: 1,
    max: 100,
  },
];

const visibleWhenFields: ConfigField[] = [
  {
    type: 'select',
    key: 'mode',
    label: 'Mode',
    options: [
      { value: 'simple', label: 'Simple' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
  {
    type: 'nested-number',
    key: 'advanced',
    subKey: 'threshold',
    label: 'Threshold',
    min: 1,
    max: 100,
    visibleWhen: { key: 'mode', value: 'advanced' },
  },
];

const scenarioData: Record<
  Scenario,
  { fields: ConfigField[]; config: Record<string, unknown> }
> = {
  'primitive-types': {
    fields: primitiveFields,
    config: { size: 'medium', count: 5, enabled: true },
  },
  'nested-types': {
    fields: nestedFields,
    config: { group: { mode: 'auto', size: 4 } },
  },
  'nested-select-or-number': {
    fields: selectOrNumberFields,
    config: { range: { max: 10 } },
  },
  'visible-when-hidden': {
    fields: visibleWhenFields,
    config: { mode: 'simple', advanced: { threshold: 50 } },
  },
  'visible-when-shown': {
    fields: visibleWhenFields,
    config: { mode: 'advanced', advanced: { threshold: 50 } },
  },
};

const meta: Meta<StoryArgs> = {
  component: ConfigFormFields as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    scenario: 'primitive-types',
    onChange: fn(),
  },
  argTypes: {
    scenario: {
      control: { type: 'select' },
      options: [
        'primitive-types',
        'nested-types',
        'nested-select-or-number',
        'visible-when-hidden',
        'visible-when-shown',
      ] satisfies Scenario[],
    },
    onChange: { table: { disable: true } },
    fields: { table: { disable: true } },
    config: { table: { disable: true } },
  },
  render: ({ scenario, onChange }) => {
    const { fields, config } = scenarioData[scenario];
    return (
      <ConfigFormFields
        fields={fields}
        config={config}
        onChange={onChange}
      />
    );
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};
