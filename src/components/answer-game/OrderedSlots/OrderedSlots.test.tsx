import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderedSlots } from './OrderedSlots';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { ReactNode } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { TouchKeyboardContext } from '@/components/answer-game/TouchKeyboardContext';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
}));

const config: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
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
  {
    id: 'z1',
    index: 1,
    expectedValue: 'a',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z2',
    index: 2,
    expectedValue: 't',
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <AnswerGameProvider config={config}>
    <Initialiser>{children}</Initialiser>
  </AnswerGameProvider>
);

describe('OrderedSlots', () => {
  it('renders one slot per zone', () => {
    render(<OrderedSlots />, { wrapper });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('slot 1 has aria-label "Slot 1, empty"', () => {
    render(<OrderedSlots />, { wrapper });
    expect(
      screen.getByRole('listitem', { name: 'Slot 1, empty' }),
    ).toBeInTheDocument();
  });

  it('filled slot shows placed tile label', () => {
    const TestWithPlacement = () => {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      return <OrderedSlots />;
    };
    render(
      <AnswerGameProvider config={config}>
        <TestWithPlacement />
      </AnswerGameProvider>,
    );
    expect(
      screen.getByRole('listitem', { name: 'Slot 1, filled with c' }),
    ).toBeInTheDocument();
  });

  it('tapping an empty slot calls focusKeyboard from context', async () => {
    const user = userEvent.setup();
    const focusKeyboard = vi.fn();

    render(
      <AnswerGameProvider config={config}>
        <Initialiser>
          <TouchKeyboardContext.Provider value={focusKeyboard}>
            <OrderedSlots />
          </TouchKeyboardContext.Provider>
        </Initialiser>
      </AnswerGameProvider>,
    );

    await user.click(
      screen.getByRole('listitem', { name: 'Slot 1, empty' }),
    );
    expect(focusKeyboard).toHaveBeenCalledOnce();
  });

  it('tapping a filled slot does not call focusKeyboard', async () => {
    const user = userEvent.setup();
    const focusKeyboard = vi.fn();

    const TestWithFilled = () => {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      return (
        <TouchKeyboardContext.Provider value={focusKeyboard}>
          <OrderedSlots />
        </TouchKeyboardContext.Provider>
      );
    };
    render(
      <AnswerGameProvider config={config}>
        <TestWithFilled />
      </AnswerGameProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Slot 1, filled with c' }),
    );
    expect(focusKeyboard).not.toHaveBeenCalled();
  });
});
