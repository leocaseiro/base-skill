import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberMatch } from './NumberMatch';
import type { NumberMatchConfig } from '../types';

const navigateStub = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateStub,
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  isSpeechActive: vi.fn().mockReturnValue(false),
}));
const noopUnsubscribe = () => {};
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({
    emit: vi.fn(),
    subscribe: vi.fn(() => noopUnsubscribe),
  }),
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

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  queueSound: vi.fn().mockImplementation(() => Promise.resolve()),
  whenSoundEnds: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock('canvas-confetti', () => ({
  default: Object.assign(
    vi.fn().mockImplementation(() => Promise.resolve()),
    { reset: vi.fn() },
  ),
}));

const config: NumberMatchConfig = {
  gameId: 'number-match-test',
  component: 'NumberMatch',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: true,
  ttsEnabled: true,
  mode: 'numeral-to-group',
  tileStyle: 'dots',
  range: { min: 1, max: 5 },
  rounds: [{ value: 3 }, { value: 5 }, { value: 1 }],
};

describe('NumberMatch', () => {
  it('renders a TextQuestion for numeral-to-group mode', () => {
    render(<NumberMatch config={config} />);
    expect(
      screen.getByRole('button', { name: '3 — tap to hear' }),
    ).toBeInTheDocument();
  });

  it('renders a DotGroupQuestion for group-to-numeral mode', () => {
    const groupConfig: NumberMatchConfig = {
      ...config,
      mode: 'group-to-numeral',
    };
    render(<NumberMatch config={groupConfig} />);
    expect(
      screen.getAllByRole('button', { name: /^Dot \d+ of \d+$/ })
        .length,
    ).toBeGreaterThan(0);
  });

  it('renders one pair zone per round value', () => {
    render(<NumberMatch config={config} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows correct tile plus distractors in the bank', () => {
    const distractorConfig: NumberMatchConfig = {
      ...config,
      tileBankMode: 'distractors',
      distractorCount: 3,
      range: { min: 1, max: 9 },
      rounds: [{ value: 5 }],
    };
    render(<NumberMatch config={distractorConfig} />);
    expect(
      screen.getAllByRole('button', { name: /^Number \d+$/ }),
    ).toHaveLength(4);
  });
});

describe('NumberMatch Play again', () => {
  it('resets the game to round 1 after game-over with roundsInOrder: true', async () => {
    const user = userEvent.setup();

    const oneRoundConfig: NumberMatchConfig = {
      gameId: 'number-match-test',
      component: 'NumberMatch',
      inputMethod: 'type',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 1,
      roundsInOrder: true,
      ttsEnabled: false,
      mode: 'numeral-to-group',
      tileStyle: 'dots',
      range: { min: 1, max: 5 },
      rounds: [{ value: 1 }],
    };

    render(<NumberMatch config={oneRoundConfig} />);

    // Game starts in playing phase — 1 answer slot visible, no game-over dialog
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(
      screen.queryByRole('dialog', { name: 'Game complete' }),
    ).not.toBeInTheDocument();

    // Type '1' to correctly fill the only slot → phase transitions to game-over
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '1', bubbles: true }),
      );
    });

    // Game-over overlay appears
    await screen.findByRole('button', { name: 'Play again' });
    expect(
      screen.getByRole('dialog', { name: 'Game complete' }),
    ).toBeInTheDocument();

    // Click "Play again"
    await user.click(
      screen.getByRole('button', { name: 'Play again' }),
    );

    // Overlay is gone and game has restarted at round 1
    expect(
      screen.queryByRole('dialog', { name: 'Game complete' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
