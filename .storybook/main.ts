import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/react-vite';

/** HAST node types MDX emits; rehype-raw must pass them through (see hast-util-raw). */
const mdxRehypePassThrough = [
  'mdxFlowExpression',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxTextExpression',
  'mdxjsEsm',
] as const;

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx', '../src/**/*.mdx'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [
              remarkFrontmatter,
              remarkGfm,
              remarkDirective,
              remarkMath,
            ],
            // Raw HTML is parsed then sanitized (XSS). Format runs last on the tree.
            rehypePlugins: [
              [rehypeRaw, { passThrough: [...mdxRehypePassThrough] }],
              rehypeSanitize,
              rehypeFormat,
            ],
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
