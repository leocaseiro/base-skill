import '../src/styles.css';
import '../src/lib/i18n/i18n';
import { ThemeProvider } from 'next-themes';
import { withTheme } from './decorators/withTheme';
import type { Decorator, Preview } from '@storybook/react';

const withAppThemeProvider: Decorator = (Story) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    enableSystem={false}
  >
    {Story()}
  </ThemeProvider>
);

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Ocean Light' },
          { value: 'dark', title: 'Ocean Dark' },
          { value: 'forest-light', title: 'Forest Light' },
          { value: 'forest-dark', title: 'Forest Dark' },
          { value: 'high-contrast', title: 'High Contrast' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [withAppThemeProvider, withTheme],
  parameters: {
    viewport: {
      viewports: {
        mobileSm: {
          name: 'Phone S (360×640)',
          styles: { width: '360px', height: '640px' },
        },
        mobileLg: {
          name: 'Phone L (390×844)',
          styles: { width: '390px', height: '844px' },
        },
        tabletPortrait: {
          name: 'Tablet Portrait (768×1024)',
          styles: { width: '768px', height: '1024px' },
        },
        tabletLandscape: {
          name: 'Tablet Landscape (1024×768)',
          styles: { width: '1024px', height: '768px' },
        },
        desktop: {
          name: 'Desktop (1280×800)',
          styles: { width: '1280px', height: '800px' },
        },
      },
      defaultViewport: 'tabletLandscape',
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
};

export default preview;
