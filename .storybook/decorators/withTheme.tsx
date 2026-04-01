import { useEffect } from 'react';
import { applyThemeCssVars } from '../../src/lib/theme/css-vars';
import { defaultThemeCssVars } from '../../src/lib/theme/default-tokens';
import type { Decorator, StoryFn } from '@storybook/react';

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

const WithThemeInner = ({
  Story,
  themeKey,
}: {
  Story: StoryFn;
  themeKey: string | undefined;
}) => {
  const theme = themeKey ?? 'light';

  useEffect(() => {
    const vars = THEME_VARS[theme] ?? defaultThemeCssVars;
    applyThemeCssVars(document.documentElement, vars);

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(
      theme === 'dark' ? 'dark' : 'light',
    );
  }, [theme]);

  return <Story />;
};

export const withTheme: Decorator = (Story, context) => (
  <WithThemeInner
    Story={Story}
    themeKey={context.globals['theme'] as string | undefined}
  />
);
