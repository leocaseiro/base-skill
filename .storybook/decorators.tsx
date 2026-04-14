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
    style={
      {
        // Provide ocean-dark token values inline so that CSS custom properties
        // like --background resolve correctly within this div. Without these,
        // --bs-* vars inherit from html (light-mode values set by withTheme)
        // and axe-core computes contrast against a light background.
        '--bs-background': '#03045E',
        '--bs-surface': '#0077B6',
        '--bs-text': '#CAF0F8',
        '--bs-primary': '#48CAE4',
        '--bs-secondary': '#90E0EF',
        '--bs-accent': '#FFB703',
        '--bs-success': '#2DC653',
        '--bs-warning': '#F4A261',
        '--bs-error': '#E63946',
        background: 'var(--background)',
        padding: '1rem',
      } as React.CSSProperties
    }
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
