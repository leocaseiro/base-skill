import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WordSpell } from './WordSpell';
import type { WordSpellConfig } from '../types';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

const config: WordSpellConfig = {
  gameId: 'word-spell-test',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 2,
  ttsEnabled: true,
  mode: 'picture',
  tileUnit: 'letter',
  rounds: [
    { word: 'cat', image: 'https://placehold.co/160' },
    { word: 'dog', image: 'https://placehold.co/160' },
  ],
};

describe('WordSpell', () => {
  it('renders the game with letter tiles for the first round word', () => {
    render(<WordSpell config={config} />);
    expect(
      screen.getByRole('button', { name: 'Letter C' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter A' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter T' }),
    ).toBeInTheDocument();
  });

  it('renders three answer slots for "cat"', () => {
    render(<WordSpell config={config} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('does not render image in recall mode', () => {
    const recallConfig: WordSpellConfig = {
      ...config,
      mode: 'recall',
      rounds: [{ word: 'cat' }],
    };
    render(<WordSpell config={recallConfig} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
