import { PhonemeBlender } from './PhonemeBlender';
import type { Meta, StoryObj } from '@storybook/react';

const cat = [
  { g: 'c', p: 'k' },
  { g: 'a', p: 'æ' },
  { g: 't', p: 't' },
];

const putting = [
  { g: 'p', p: 'p' },
  { g: 'u', p: 'ʊ' },
  { g: 'tt', p: 't' },
  { g: 'ing', p: 'ɪŋ' },
];

const friend = [
  { g: 'f', p: 'f' },
  { g: 'r', p: 'r' },
  { g: 'ie', p: 'e' },
  { g: 'nd', p: 'nd' },
];

const meta: Meta<typeof PhonemeBlender> = {
  component: PhonemeBlender,
  title: 'Components/PhonemeBlender',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    word: { control: 'text' },
    graphemes: { control: false },
    phonemeOverrides: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof PhonemeBlender>;

export const Default: Story = {
  args: { word: 'cat', graphemes: cat },
};

export const Multisyllable: Story = {
  args: { word: 'putting', graphemes: putting },
};

export const Level4: Story = {
  args: { word: 'friend', graphemes: friend },
};

export const LandscapePhone: Story = {
  args: { word: 'putting', graphemes: putting },
  parameters: {
    viewport: { defaultViewport: 'mobile2' },
  },
};
