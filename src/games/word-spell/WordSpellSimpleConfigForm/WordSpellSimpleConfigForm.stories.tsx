import { useState } from 'react';
import { fn } from 'storybook/test';
import { dragonCaveSkin } from '../skins/dragon-cave-skin';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, JSX } from 'react';
import {
  __resetSkinRegistryForTests,
  registerSkin,
} from '@/lib/skin/registry';

type SkinsRegistered = 'classic-only' | 'classic+dragon-cave';

type Mode = 'recall' | 'picture';

type InputMethod = 'drag' | 'type' | 'both';

interface StoryArgs {
  skinsRegistered: SkinsRegistered;
  mode: Mode;
  inputMethod: InputMethod;
  onChange: (config: Record<string, unknown>) => void;
}

const Harness = ({
  mode,
  inputMethod,
  onChange,
}: {
  mode: Mode;
  inputMethod: InputMethod;
  onChange: (config: Record<string, unknown>) => void;
}): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    selectedUnits: [],
    region: 'aus',
    inputMethod,
    mode,
  });
  const handleChange = (next: Record<string, unknown>): void => {
    setConfig(next);
    onChange(next);
  };
  return (
    <WordSpellSimpleConfigForm
      config={config}
      onChange={handleChange}
    />
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Games/WordSpell/SimpleConfigForm',
  component:
    WordSpellSimpleConfigForm as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Kid-accessible simple form for WordSpell. The Skin radio appears only when ≥ 2 skins are registered for `word-spell`; flip the `skinsRegistered` control to preview both states.',
      },
    },
  },
  args: {
    skinsRegistered: 'classic+dragon-cave',
    mode: 'recall',
    inputMethod: 'drag',
    onChange: fn(),
  },
  argTypes: {
    skinsRegistered: {
      control: { type: 'radio' },
      options: [
        'classic-only',
        'classic+dragon-cave',
      ] satisfies SkinsRegistered[],
      description:
        'Skin registry preset. `classic-only` hides the Skin radio; `classic+dragon-cave` shows it.',
    },
    mode: {
      control: { type: 'radio' },
      options: ['recall', 'picture'] satisfies Mode[],
    },
    inputMethod: {
      control: { type: 'radio' },
      options: ['drag', 'type', 'both'] satisfies InputMethod[],
    },
    onChange: { table: { disable: true } },
  },
  decorators: [
    (Story, ctx) => {
      __resetSkinRegistryForTests();
      if (ctx.args.skinsRegistered === 'classic+dragon-cave') {
        registerSkin('word-spell', dragonCaveSkin);
      }
      return <Story />;
    },
  ],
  render: ({ skinsRegistered, mode, inputMethod, onChange }) => (
    <Harness
      key={`${skinsRegistered}:${mode}:${inputMethod}`}
      mode={mode}
      inputMethod={inputMethod}
      onChange={onChange}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
