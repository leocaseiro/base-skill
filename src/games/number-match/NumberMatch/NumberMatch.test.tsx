import { render, screen } from '@testing-library/react';
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

vi.mock(
  '@/components/answer-game/InstructionsOverlay/InstructionsOverlay',
  () => ({
    InstructionsOverlay: ({
      onStart,
    }: {
      onStart: () => void;
      text: string;
      ttsEnabled: boolean;
    }) => {
      onStart();
      return null;
    },
  }),
);

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
      screen.getByRole('button', { name: /tap to hear/i }),
    ).toBeInTheDocument();
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
