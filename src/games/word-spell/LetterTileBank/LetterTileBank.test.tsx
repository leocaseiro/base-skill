import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
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
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const bankDropState = vi.hoisted(() => ({ isDragOver: false }));

vi.mock('@/components/answer-game/useBankDropTarget', () => ({
  useBankDropTarget: () => ({
    bankRef: { current: null },
    get isDragOver() {
      return bankDropState.isDragOver;
    },
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
  it('shows dashed hole preview when a slot tile is dragged over the bank (isDragOver)', () => {
    bankDropState.isDragOver = true;
    const Preview = () => {
      const dispatch = useAnswerGameDispatch();
      useEffect(() => {
        dispatch({ type: 'INIT_ROUND', tiles, zones });
        dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: 't1' });
      }, [dispatch]);
      return <LetterTileBank />;
    };
    const { container } = render(
      <AnswerGameProvider config={config}>
        <Preview />
      </AnswerGameProvider>,
    );
    const hole = container.querySelector('[data-tile-bank-hole="t1"]');
    expect(hole?.className).toMatch(/border-dashed/);
    expect(hole?.textContent).toContain('c');
    bankDropState.isDragOver = false;
  });

  it('shows dashed overlay on a bank tile when drag hovers that bank tile', () => {
    bankDropState.isDragOver = false;
    const Preview = () => {
      const dispatch = useAnswerGameDispatch();
      useEffect(() => {
        dispatch({ type: 'INIT_ROUND', tiles, zones });
        dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: 't1' });
        dispatch({ type: 'SET_DRAG_HOVER_BANK', tileId: 't2' });
      }, [dispatch]);
      return <LetterTileBank />;
    };
    const { container } = render(
      <AnswerGameProvider config={config}>
        <Preview />
      </AnswerGameProvider>,
    );
    const overlays = container.querySelectorAll(
      '.border-dashed.border-primary',
    );
    expect(overlays.length).toBeGreaterThanOrEqual(1);
    bankDropState.isDragOver = false;
  });

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

  it('placed tile is rendered as a hole, not a button', () => {
    const TestWithPlace = () => {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      return <LetterTileBank />;
    };
    const { container } = render(
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
    expect(
      container.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThan(0);
  });
});
