import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderedLetterSlots } from './OrderedLetterSlots';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { ReactNode } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';

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

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AnswerGameProvider config={config}>
      <Initialiser>{children}</Initialiser>
    </AnswerGameProvider>
  );
}

describe('OrderedLetterSlots', () => {
  it('renders one slot per zone', () => {
    render(<OrderedLetterSlots />, { wrapper });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('slot 1 has aria-label "Slot 1, empty"', () => {
    render(<OrderedLetterSlots />, { wrapper });
    expect(
      screen.getByRole('listitem', { name: 'Slot 1, empty' }),
    ).toBeInTheDocument();
  });

  it('filled slot shows placed tile label', () => {
    const TestWithPlacement = () => {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't1', zoneIndex: 0 });
      return <OrderedLetterSlots />;
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
});
