import { useEffect } from 'react';
import type { Decorator } from '@storybook/react';

/**
 * Wraps the story in a dark-mode container.
 * Use on individual stories that should always render dark,
 * independently of the global Storybook theme switcher.
 *
 * Tailwind v4 @custom-variant dark (&:is(.dark *)) means any
 * .dark ancestor enables dark utility classes on descendants.
 */
export const withDarkMode: Decorator = (Story) => (
  <div
    className="dark"
    style={{ background: 'var(--background)', padding: '1rem' }}
  >
    <Story />
  </div>
);

/**
 * Inner component that applies document-level dark mode for the duration of the story.
 * Required for portal-based components (e.g. InstructionsOverlay via createPortal)
 * that render outside the .dark wrapper div used by withDarkMode.
 * Cleans up on unmount to prevent leaking dark state to other stories.
 */
const DocumentDarkModeWrapper = ({
  Story,
}: {
  Story: React.ComponentType;
}) => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = 'dark';
    return () => {
      document.documentElement.classList.remove('dark');
      delete document.documentElement.dataset.theme;
    };
  }, []);
  return <Story />;
};

export const withDocumentDarkMode: Decorator = (Story) => (
  <DocumentDarkModeWrapper Story={Story} />
);
