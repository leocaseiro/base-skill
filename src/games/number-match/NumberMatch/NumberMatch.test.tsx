import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberMatch } from './NumberMatch';
import type { NumberMatchConfig } from '../types';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

const config: NumberMatchConfig = {
  gameId: 'number-match-test',
  component: 'NumberMatch',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
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
});
