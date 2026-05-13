// Co-located preview of the WordSpell config form, driven by the real
// `wordSpellConfigFields` registry export and `WordSpellSimpleConfigForm`
// for simple-mode preview.
//
// Pattern precedent: per-game `InstructionsOverlay` stories (PR #141).
import { useState } from 'react';
import { fn } from 'storybook/test';
import { dragonCaveSkin } from './skins/dragon-cave-skin';
import { wordSpellConfigFields } from './types';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm/WordSpellSimpleConfigForm';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { getAdvancedHeaderRenderer } from '@/games/config-fields-registry';
import {
  __resetSkinRegistryForTests,
  registerSkin,
} from '@/lib/skin/registry';

type Mode = 'simple' | 'advanced';

type Scenario = 'picture' | 'scramble' | 'sentence-gap';

type SkinsRegistered = 'classic-only' | 'classic+dragon-cave';

const scenarios: Record<Scenario, Record<string, unknown>> = {
  picture: {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'exact',
    totalRounds: 5,
    mode: 'picture',
    tileUnit: 'letter',
    roundsInOrder: false,
    ttsEnabled: true,
  },
  scramble: {
    inputMethod: 'both',
    wrongTileBehavior: 'reject',
    tileBankMode: 'distractors',
    totalRounds: 6,
    mode: 'scramble',
    tileUnit: 'letter',
    roundsInOrder: true,
    ttsEnabled: false,
  },
  'sentence-gap': {
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'distractors',
    totalRounds: 4,
    mode: 'sentence-gap',
    tileUnit: 'word',
    roundsInOrder: false,
    ttsEnabled: true,
  },
};

const simpleBaseline: Record<string, unknown> = {
  configMode: 'simple',
  inputMethod: 'drag',
  level: 1,
  phonemesAllowed: [],
};

type HarnessProps = {
  mode: Mode;
  scenario: Scenario;
  onChange: (config: Record<string, unknown>) => void;
};

interface StoryArgs {
  mode: Mode;
  scenario: Scenario;
  skinsRegistered: SkinsRegistered;
  onChange: (config: Record<string, unknown>) => void;
}

// Match `AdvancedConfigModal`: render the per-game advanced header above the
// generic field list. WordSpell's header is `WordSpellLibrarySource`.
const AdvancedHeader = getAdvancedHeaderRenderer('word-spell');

const WordSpellConfigFormHarness = ({
  mode,
  scenario,
  onChange,
}: HarnessProps): JSX.Element => {
  const initial =
    mode === 'simple' ? simpleBaseline : scenarios[scenario];
  const [config, setConfig] = useState<Record<string, unknown>>(
    () => initial,
  );
  const handleChange = (next: Record<string, unknown>): void => {
    setConfig(next);
    onChange(next);
  };
  if (mode === 'simple') {
    return (
      <WordSpellSimpleConfigForm
        config={config}
        onChange={handleChange}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {AdvancedHeader && (
        <AdvancedHeader config={config} onChange={handleChange} />
      )}
      <ConfigFormFields
        fields={wordSpellConfigFields}
        config={config}
        onChange={handleChange}
      />
    </div>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Games/WordSpell/ConfigForm',
  // Double cast: StoryArgs adds `skinsRegistered` (a registry preset, not a
  // harness prop), so its shape isn't 1:1 with the harness component. The
  // render function fully controls how StoryArgs maps to harness props;
  // `component` is only used for autodocs.
  component:
    WordSpellConfigFormHarness as unknown as ComponentType<StoryArgs>,
  tags: ['autodocs'],
  args: {
    mode: 'advanced',
    scenario: 'picture',
    skinsRegistered: 'classic+dragon-cave',
    onChange: fn(),
  },
  argTypes: {
    mode: {
      control: { type: 'radio' },
      options: ['simple', 'advanced'] satisfies Mode[],
      description:
        'Which form variant to preview: the kid-friendly Simple form or the full Advanced field list.',
    },
    scenario: {
      control: { type: 'radio' },
      options: [
        'picture',
        'scramble',
        'sentence-gap',
      ] satisfies Scenario[],
      description:
        'Advanced-mode preset covering meaningful WordSpell modes: picture (letters), scramble (letters with distractors), sentence-gap (word tiles).',
      if: { arg: 'mode', eq: 'advanced' },
    },
    skinsRegistered: {
      control: { type: 'radio' },
      options: [
        'classic-only',
        'classic+dragon-cave',
      ] satisfies SkinsRegistered[],
      description:
        'Skin registry preset. `classic-only` hides the Skin radio in both simple and advanced forms; `classic+dragon-cave` shows it.',
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
  render: ({ mode, scenario, skinsRegistered, onChange }) => (
    <WordSpellConfigFormHarness
      // Include skinsRegistered in the key so the harness remounts when
      // the registry decorator changes — guaranteeing the radio's
      // visibility refreshes immediately.
      key={`${mode}:${scenario}:${skinsRegistered}`}
      mode={mode}
      scenario={scenario}
      onChange={onChange}
    />
  ),
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {};
