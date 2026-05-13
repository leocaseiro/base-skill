import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { wordSpellConfigFields } from './types';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { dragonCaveSkin } from '@/games/word-spell/skins/dragon-cave-skin';
import {
  __resetSkinRegistryForTests,
  registerSkin,
} from '@/lib/skin/registry';

describe('wordSpellConfigFields — Skin entry', () => {
  beforeEach(() => {
    __resetSkinRegistryForTests();
  });

  it('omits the Skin field when only classic is registered', () => {
    render(
      <ConfigFormFields
        fields={wordSpellConfigFields}
        config={{}}
        onChange={() => {}}
      />,
    );
    expect(
      screen.queryByRole('radiogroup', { name: /skin/i }),
    ).toBeNull();
  });

  it('renders the Skin radio when dragon-cave is registered', () => {
    registerSkin('word-spell', dragonCaveSkin);
    render(
      <ConfigFormFields
        fields={wordSpellConfigFields}
        config={{}}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole('radiogroup', { name: /skin/i }),
    ).toBeInTheDocument();
  });
});
