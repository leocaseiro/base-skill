import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DiceFace,
  DominoTile,
  NumeralTileBank,
} from './NumeralTileBank';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { ReactNode } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';

import { speak } from '@/lib/speech/SpeechOutput';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  isSpeechActive: vi.fn().mockReturnValue(false),
}));
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));
vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
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
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: '3', value: '3' },
  { id: 't2', label: '5', value: '5' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: '3',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const Initialiser = ({ children }: { children: ReactNode }) => {
  const dispatch = useAnswerGameDispatch();
  dispatch({ type: 'INIT_ROUND', tiles, zones });
  return <>{children}</>;
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AnswerGameProvider config={config}>
      <Initialiser>{children}</Initialiser>
    </AnswerGameProvider>
  );
}

describe('DiceFace', () => {
  it('renders 1 pip for value 1', () => {
    const { container } = render(<DiceFace value={1} />);
    expect(container.querySelectorAll('[data-pip]')).toHaveLength(1);
  });

  it('renders 6 pips for value 6', () => {
    const { container } = render(<DiceFace value={6} />);
    expect(container.querySelectorAll('[data-pip]')).toHaveLength(6);
  });

  it('renders 9 cells in the 3×3 grid', () => {
    const { container } = render(<DiceFace value={1} />);
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(9);
  });
});

describe('DominoTile', () => {
  it('renders 7 pips for value 7 (4+3)', () => {
    const { container } = render(<DominoTile value={7} />);
    expect(container.querySelectorAll('[data-pip]')).toHaveLength(7);
  });

  it('renders 12 pips for value 12 (6+6)', () => {
    const { container } = render(<DominoTile value={12} />);
    expect(container.querySelectorAll('[data-pip]')).toHaveLength(12);
  });

  it('has a visible centre divider', () => {
    const { container } = render(<DominoTile value={8} />);
    expect(
      container.querySelector('[data-divider]'),
    ).toBeInTheDocument();
  });
});

describe('NumeralTileBank', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tiles for all bank tile IDs', () => {
    render(<NumeralTileBank tileStyle="dots" />, { wrapper });
    expect(
      screen.getByRole('button', { name: /3/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /5/i }),
    ).toBeInTheDocument();
  });

  it('calls speak() with the tile label on click when ttsEnabled', async () => {
    render(<NumeralTileBank tileStyle="dots" />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: /3/i }));
    expect(speak).toHaveBeenCalledWith(
      '3',
      expect.objectContaining({ rate: 1 }),
    );
  });
});
