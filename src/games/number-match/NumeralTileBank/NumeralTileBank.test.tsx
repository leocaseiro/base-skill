import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NumeralTileBank } from './NumeralTileBank';
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
}));
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
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
    expect(speak).toHaveBeenCalledWith('3');
  });
});
