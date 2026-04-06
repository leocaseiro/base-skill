import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WordSpell } from './WordSpell';
import type { WordSpellConfig } from '../types';

const navigateStub = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateStub,
}));

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  isSpeechActive: vi.fn().mockReturnValue(false),
}));
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));
vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      speechRate: 1,
      volume: 0.8,
      preferredVoiceURI: undefined,
    },
    update: vi.fn(),
  }),
}));

const config: WordSpellConfig = {
  gameId: 'word-spell-test',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 2,
  roundsInOrder: true,
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
      screen.getByRole('button', { name: 'Letter c' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter a' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter t' }),
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

  it('renders native emoji when round.emoji is set (no img)', () => {
    const emojiConfig: WordSpellConfig = {
      ...config,
      rounds: [{ word: 'cat', emoji: '🐱' }],
    };
    render(<WordSpell config={emojiConfig} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cat — tap to hear/i }),
    ).toBeInTheDocument();
  });
});
