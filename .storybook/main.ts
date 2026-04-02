import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw';
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
            rehypePlugins: [
              [rehypeRaw, { passThrough: [...mdxRehypePassThrough] }],
              // No `rehype-sanitize` here: `hast-util-sanitize` only handles HAST
              // `element` nodes. MDX custom components are `mdxJsxFlowElement` etc.,
              // which the sanitizer drops in its default branch—so interactive
              // demos vanished from `storybook build` / GitHub Pages while dev
              // could still look fine depending on cache. MDX under `src/` is
              // trusted first-party content.
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
