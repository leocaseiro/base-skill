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
  | 'visible-when-shown'
  | 'radio-variant';

type OptionsCount = 1 | 2 | 3;

interface StoryArgs {
  scenario: Scenario;
  /**
   * Only meaningful when `scenario === 'radio-variant'`. Drives the
   * `optionsSource()` callable on the radio field so reviewers can flip
   * between "1 option (hidden via gate)" and "2+ options (visible)".
   */
  optionsCount: OptionsCount;
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

const radioSkinOptions: { value: string; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'dragon-cave', label: 'Dragon Cave' },
  { value: 'extra', label: 'Extra' },
];

const buildRadioFields = (count: OptionsCount): ConfigField[] => [
  {
    type: 'radio',
    key: 'skin',
    label: 'Skin',
    optionsSource: () => radioSkinOptions.slice(0, count),
  },
];

const staticScenarioData: Record<
  Exclude<Scenario, 'radio-variant'>,
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
  title: 'Components/ConfigFormFields',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Generic form renderer for the ConfigField union — used by SimpleConfigForm and AdvancedConfigModal across every game. The scenario select cycles through every rendering branch (primitive types, nested types, select-or-number, visibleWhen-hidden, visibleWhen-shown, radio-variant) so reviewers can see every branch in one place. The radio-variant scenario uses the optionsCount control to demonstrate the render-time visibility gate (hides when fewer than 2 options). Per-game fixtures live in co-located stories under src/games/<game>/.',
      },
    },
  },
  args: {
    scenario: 'primitive-types',
    optionsCount: 2,
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
        'radio-variant',
      ] satisfies Scenario[],
    },
    optionsCount: {
      control: { type: 'radio' },
      options: [1, 2, 3] satisfies OptionsCount[],
      description:
        'Number of radio options for the radio-variant scenario. 1 triggers the visibility gate (field hidden); 2+ renders the radiogroup.',
    },
    onChange: { table: { disable: true } },
    fields: { table: { disable: true } },
    config: { table: { disable: true } },
  },
  render: ({ scenario, optionsCount, onChange }) => {
    if (scenario === 'radio-variant') {
      return (
        <ConfigFormFields
          fields={buildRadioFields(optionsCount)}
          config={{ skin: 'classic' }}
          onChange={onChange}
        />
      );
    }
    const { fields, config } = staticScenarioData[scenario];
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

export const Playground: Story = {};
