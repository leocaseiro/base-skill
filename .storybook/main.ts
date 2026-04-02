import remarkGfm from 'remark-gfm';
import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx', '../src/**/*.mdx'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-mcp',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: '.storybook/vite.config.ts',
      },
    },
  },
  docs: {},
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      // Relative base so static builds work when served from the output root (test-runner, local)
      // and when deployed under /base-skill/docs/ on GitHub Pages (asset URLs stay under that path).
      base: './',
    }),
};

export default config;
