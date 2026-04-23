import { WordLibraryExplorer } from './WordLibraryExplorer';
import type { Meta, StoryObj } from '@storybook/react';

// WordLibraryExplorer is a zero-prop dev-only tool that owns all of its
// filter state internally via `useState`. There is nothing meaningful to
// externalise as a Controls-panel arg — every user-configurable dial
// (region, levels, syllables, fallback, advanced grapheme/phoneme filters)
// is already a live form control inside the rendered component. The
// Playground therefore exposes zero controls and renders the component
// directly. Logic coverage for the helper collectors lives in
// `WordLibraryExplorer.test.ts`.
const meta: Meta<typeof WordLibraryExplorer> = {
  component: WordLibraryExplorer,
  title: 'Data/WordLibraryExplorer',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Developer-only word-library explorer. Zero-prop — the component owns region / level / syllable / grapheme-phoneme filter state internally, so the Playground exposes no Controls. Interact with the in-canvas filter sidebar to exercise behaviour. Helper collector assertions (`collectGraphemePairs`, `collectGraphemeStrings`, `collectPhonemeStrings`) live in `WordLibraryExplorer.test.ts`.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            // The explorer's filter dropdowns use Radix Select without visible
            // labels because they are dev-only UI. Suppressed here rather than
            // adding aria-labels to a tool that is never shipped to users.
            id: 'button-name',
            enabled: false,
          },
          {
            // Dev-only explorer tool — colour tokens are informational, not
            // shipped to users. TODO: audit explorer UI colour tokens.
            id: 'color-contrast',
            enabled: false,
          },
        ],
      },
    },
  },
  render: () => <WordLibraryExplorer />,
};
export default meta;

type Story = StoryObj<typeof WordLibraryExplorer>;

export const Playground: Story = {};
