import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SpotAll } from './SpotAll';
import type { SpotAllConfig } from '../types';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  whenSoundEnds: () => Promise.resolve(),
}));

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: () => ({ settings: { speechRate: 1, volume: 0.8 } }),
}));

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  isSpeechActive: () => false,
}));

vi.mock('@/lib/skin', () => ({
  useGameSkin: () => ({
    id: 'classic',
    name: 'Classic',
    tokens: {},
    SceneBackground: null,
    RoundCompleteEffect: null,
    CelebrationOverlay: null,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.target ? `Select all the ${opts.target} tiles` : key,
    i18n: { language: 'en' },
  }),
}));

const config: SpotAllConfig = {
  gameId: 'spot-all',
  component: 'SpotAll',
  configMode: 'simple',
  selectedConfusablePairs: [
    { pair: ['b', 'd'], type: 'mirror-horizontal' },
    { pair: ['b', 'p'], type: 'mirror-vertical' },
  ],
  selectedReversibleChars: [],
  correctTileCount: 2,
  distractorCount: 2,
  totalRounds: 1,

  enabledFontIds: [],
  roundsInOrder: true,
  ttsEnabled: false,
};

describe('SpotAll', () => {
  it('renders the prompt and a grid of tiles', () => {
    render(<SpotAll config={config} seed="test-seed" />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('selects a correct tile on tap', async () => {
    const user = userEvent.setup();
    render(<SpotAll config={config} seed="test-seed" />);
    const correctTile = screen
      .getAllByRole('button')
      .find((b) => b.textContent === 'b');
    expect(correctTile).toBeDefined();
    await user.click(correctTile!);
    expect(correctTile).toHaveAttribute('aria-pressed', 'true');
  });

  it('puts a wrong tile in cooldown on tap (data-cooldown attr)', async () => {
    const user = userEvent.setup();
    render(<SpotAll config={config} seed="test-seed" />);
    const wrongTile = screen
      .getAllByRole('button')
      .find((b) => b.textContent === 'd' || b.textContent === 'p');
    expect(wrongTile).toBeDefined();
    await user.click(wrongTile!);
    expect(wrongTile).toHaveAttribute('data-cooldown', 'true');
  });
});
