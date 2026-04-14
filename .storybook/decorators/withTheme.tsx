import { useEffect } from 'react';
import { applyThemeCssVars } from '../../src/lib/theme/css-vars';
import { defaultThemeCssVars } from '../../src/lib/theme/default-tokens';
import type { Decorator } from '@storybook/react';

type DecoratorStory = Parameters<Decorator>[0];

const THEME_VARS: Record<string, Record<string, string>> = {
  light: defaultThemeCssVars,
  dark: {
    '--bs-primary': '#48CAE4',
    '--bs-secondary': '#90E0EF',
    '--bs-background': '#03045E',
    '--bs-surface': '#0077B6',
    '--bs-text': '#CAF0F8',
    '--bs-accent': '#FFB703',
    '--bs-success': '#2DC653',
    '--bs-warning': '#F4A261',
    '--bs-error': '#E63946',
  },
  'forest-light': {
    '--bs-primary': '#2D6A4F',
    '--bs-secondary': '#52B788',
    '--bs-background': '#F0F7F0',
    '--bs-surface': '#FFFFFF',
    '--bs-text': '#1A3A2A',
    '--bs-accent': '#D4A017',
    '--bs-success': '#6BCB77',
    '--bs-warning': '#F4A261',
    '--bs-error': '#E63946',
  },
  'forest-dark': {
    '--bs-primary': '#52B788',
    '--bs-secondary': '#95D5B2',
    '--bs-background': '#1A2E1F',
    '--bs-surface': '#243B2A',
    '--bs-text': '#D8F3DC',
    '--bs-accent': '#F4C842',
    '--bs-success': '#2DC653',
    '--bs-warning': '#F4A261',
    '--bs-error': '#E63946',
  },
  'high-contrast': {
    '--bs-primary': '#FFFF00',
    '--bs-secondary': '#00FFFF',
    '--bs-background': '#000000',
    '--bs-surface': '#111111',
    '--bs-text': '#FFFFFF',
    '--bs-accent': '#FF8C00',
    '--bs-success': '#00FF00',
    '--bs-warning': '#FF8C00',
    '--bs-error': '#FF0000',
  },
};

const DARK_THEMES = new Set(['dark', 'forest-dark', 'high-contrast']);

const WithThemeInner = ({
  Story,
  themeKey,
}: {
  Story: DecoratorStory;
  themeKey: string | undefined;
}) => {
  const theme = themeKey ?? 'light';

  useEffect(() => {
    const vars = THEME_VARS[theme] ?? defaultThemeCssVars;
    applyThemeCssVars(document.documentElement, vars);

    const isDark = DARK_THEMES.has(theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(isDark ? 'dark' : 'light');

    // Force Storybook Docs page backgrounds to follow the theme
    const STYLE_ID = '__sb-dark-override';
    let styleEl = document.querySelector<HTMLElement>(`#${STYLE_ID}`);
    if (isDark) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        document.head.append(styleEl);
      }
      styleEl.textContent = [
        'body, #storybook-root, .sb-main-padded,',
        '#storybook-docs, .sbdocs, .sbdocs-wrapper,',
        '.sbdocs-content, .docs-story {',
        '  background-color: var(--background) !important;',
        '  color: var(--foreground) !important;',
        '}',
      ].join('\n');
    } else {
      styleEl?.remove();
    }
  }, [theme]);

  return Story();
};

export const withTheme: Decorator = (Story, context) => (
  <WithThemeInner
    Story={Story}
    themeKey={context.globals['theme'] as string | undefined}
  />
);
