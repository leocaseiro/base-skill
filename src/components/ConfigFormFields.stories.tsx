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
