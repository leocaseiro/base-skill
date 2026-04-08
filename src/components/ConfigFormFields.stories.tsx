import { withDarkMode } from '../../.storybook/decorators';
import { ConfigFormFields } from './ConfigFormFields';
import type { ConfigField } from '@/lib/config-fields';
import type { Meta, StoryObj } from '@storybook/react';

const allFields: ConfigField[] = [
  {
    type: 'select',
    key: 'mode',
    label: 'Mode',
    options: [
      { value: 'picture', label: 'Picture' },
      { value: 'text', label: 'Text' },
    ],
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 20,
  },
  {
    type: 'checkbox',
    key: 'ttsEnabled',
    label: 'Text-to-speech',
  },
];

const meta: Meta<typeof ConfigFormFields> = {
  component: ConfigFormFields,
  tags: ['autodocs'],
  args: {
    fields: allFields,
    config: { mode: 'picture', totalRounds: 8, ttsEnabled: true },
    onChange: () => {},
  },
  argTypes: {
    onChange: { action: 'changed' },
  },
};
export default meta;

type Story = StoryObj<typeof ConfigFormFields>;

export const AllFieldTypes: Story = {};

export const AllFieldTypesDark: Story = {
  decorators: [withDarkMode],
};

const sortFields: ConfigField[] = [
  {
    type: 'nested-select',
    key: 'skip',
    subKey: 'mode',
    label: 'Skip mode',
    options: [
      { value: 'random', label: 'random' },
      { value: 'consecutive', label: 'consecutive' },
      { value: 'by', label: 'by' },
    ],
  },
  {
    type: 'nested-number',
    key: 'skip',
    subKey: 'step',
    label: 'Skip step',
    min: 2,
    max: 100,
    visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
  },
  {
    type: 'nested-select',
    key: 'skip',
    subKey: 'start',
    label: 'Skip start',
    options: [
      { value: 'range-min', label: 'range-min' },
      { value: 'random', label: 'random' },
    ],
    visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
  },
  {
    type: 'select',
    key: 'tileBankMode',
    label: 'Tile bank mode',
    options: [
      { value: 'exact', label: 'exact' },
      { value: 'distractors', label: 'distractors' },
    ],
  },
  {
    type: 'nested-select',
    key: 'distractors',
    subKey: 'source',
    label: 'Distractor source',
    options: [
      { value: 'random', label: 'random' },
      { value: 'gaps-only', label: 'gaps-only' },
      { value: 'full-range', label: 'full-range' },
    ],
    visibleWhen: { key: 'tileBankMode', value: 'distractors' },
  },
  {
    type: 'nested-select-or-number',
    key: 'distractors',
    subKey: 'count',
    label: 'Distractor count',
    min: 1,
    max: 20,
    visibleWhen: { key: 'tileBankMode', value: 'distractors' },
  },
];

export const SortNumbersFieldsExact: Story = {
  args: {
    fields: sortFields,
    config: {
      skip: { mode: 'random' },
      tileBankMode: 'exact',
      distractors: { source: 'random', count: 2 },
    },
  },
};

export const SortNumbersFieldsByMode: Story = {
  args: {
    fields: sortFields,
    config: {
      skip: { mode: 'by', step: 5, start: 'range-min' },
      tileBankMode: 'exact',
      distractors: { source: 'random', count: 2 },
    },
  },
};

export const SortNumbersFieldsDistractors: Story = {
  args: {
    fields: sortFields,
    config: {
      skip: { mode: 'random' },
      tileBankMode: 'distractors',
      distractors: { source: 'gaps-only', count: 3 },
    },
  },
};
