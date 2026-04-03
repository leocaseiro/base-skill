import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LetterTileBank } from './LetterTileBank';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { ReactNode } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';

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
  { id: 't1', label: 'c', value: 'c' },
  { id: 't2', label: 'a', value: 'a' },
  { id: 't3', label: 't', value: 't' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'c',
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

describe('LetterTileBank', () => {
  it('renders all bank tiles as buttons', () => {
    render(<LetterTileBank />, { wrapper });
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

  it('tile not in bankTileIds is not rendered', () => {
    const TestWithPlace = () => {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      return <LetterTileBank />;
    };
    render(
      <AnswerGameProvider config={config}>
        <TestWithPlace />
      </AnswerGameProvider>,
    );
    expect(
      screen.queryByRole('button', { name: 'Letter c' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Letter a' }),
    ).toBeInTheDocument();
  });
});
