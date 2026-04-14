import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SortNumbersTileBank } from './SortNumbersTileBank';
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
  gameId: 'sort-numbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const tiles: TileItem[] = [
  { id: 't1', label: '3', value: '3' },
  { id: 't2', label: '1', value: '1' },
  { id: 't3', label: '2', value: '2' },
];

const zones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: '1',
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

describe('SortNumbersTileBank', () => {
  it('shows dashed hole preview when dragging a placed tile over the bank', () => {
    bankDropState.isDragOver = true;
    const Preview = () => {
      const dispatch = useAnswerGameDispatch();
      useEffect(() => {
        dispatch({ type: 'INIT_ROUND', tiles, zones });
        dispatch({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
        dispatch({ type: 'SET_DRAG_ACTIVE', tileId: 't2' });
      }, [dispatch]);
      return <SortNumbersTileBank />;
    };
    const { container } = render(
      <AnswerGameProvider config={config}>
        <Preview />
      </AnswerGameProvider>,
    );
    const hole = container.querySelector('[data-tile-bank-hole="t2"]');
    expect(hole?.className).toMatch(/border-2/);
    expect(hole?.getAttribute('style')).toContain(
      '--skin-hover-border-style',
    );
    expect(hole?.textContent).toContain('1');
    bankDropState.isDragOver = false;
  });

  it('renders bank tiles as buttons', () => {
    render(<SortNumbersTileBank />, { wrapper });
    expect(
      screen.getByRole('button', { name: 'Number 3' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Number 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Number 2' }),
    ).toBeInTheDocument();
  });

  it('placed tile renders as hole', () => {
    const TestWithPlace = () => {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      // t2 has value '1' which matches zone z0 expectedValue '1'
      dispatch({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
      return <SortNumbersTileBank />;
    };
    const { container } = render(
      <AnswerGameProvider config={config}>
        <TestWithPlace />
      </AnswerGameProvider>,
    );
    expect(
      screen.queryByRole('button', { name: 'Number 1' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Number 3' }),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThan(0);
  });
});
