import { useEffect } from 'react';
import { DraftsPanel } from './DraftsPanel';
import { draftStore } from './draftStore';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DraftsPanel> = {
  component: DraftsPanel,
  title: 'Data/Authoring/DraftsPanel',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onClose: () => {},
    onEdit: () => {},
  },
  argTypes: { open: { control: 'boolean' } },
};
export default meta;

type Story = StoryObj<typeof DraftsPanel>;

export const Empty: Story = {
  decorators: [
    (StoryComp) => {
      useEffect(() => {
        void draftStore.__clearAllForTests();
      }, []);
      return <StoryComp />;
    },
  ],
};

export const WithDrafts: Story = {
  decorators: [
    (StoryComp) => {
      useEffect(() => {
        void (async () => {
          await draftStore.__clearAllForTests();
          await draftStore.saveDraft({
            word: 'putting',
            region: 'aus',
            level: 3,
            ipa: 'pʊtɪŋ',
            syllables: ['put', 'ting'],
            syllableCount: 2,
            graphemes: [
              { g: 'p', p: 'p' },
              { g: 'u', p: 'ʊ' },
              { g: 'tt', p: 't' },
              { g: 'ing', p: 'ɪŋ' },
            ],
            ritaKnown: true,
          });
        })();
      }, []);
      return <StoryComp />;
    },
  ],
};
