import { useEffect } from 'react';
import { applyThemeCssVars } from '../../src/lib/theme/css-vars';
import { defaultThemeCssVars } from '../../src/lib/theme/default-tokens';
import type { Decorator } from '@storybook/react';

type DecoratorStory = Parameters<Decorator>[0];

const THEME_VARS: Record<string, Record<string, string>> = {
  light: defaultThemeCssVars,
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
};

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

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('light');
  }, [theme]);

  return Story();
};

export const withTheme: Decorator = (Story, context) => (
  <WithThemeInner
    Story={Story}
    themeKey={context.globals['theme'] as string | undefined}
  />
);
