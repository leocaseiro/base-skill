import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NumberSequenceSlots } from './NumberSequenceSlots';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { ReactNode } from 'react';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';

const config: AnswerGameConfig = {
  gameId: 'sort-numbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
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
  {
    id: 'z1',
    index: 1,
    expectedValue: '2',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z2',
    index: 2,
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

describe('NumberSequenceSlots', () => {
  it('renders one slot per zone', () => {
    render(<NumberSequenceSlots />, { wrapper });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('slot 1 has aria-label "Slot 1, empty"', () => {
    render(<NumberSequenceSlots />, { wrapper });
    expect(
      screen.getByRole('listitem', { name: 'Slot 1, empty' }),
    ).toBeInTheDocument();
  });

  it('filled slot shows placed tile label', () => {
    const TestWithPlacement = () => {
      const dispatch = useAnswerGameDispatch();
      dispatch({ type: 'INIT_ROUND', tiles, zones });
      dispatch({ type: 'PLACE_TILE', tileId: 't2', zoneIndex: 0 });
      return <NumberSequenceSlots />;
    };
    render(
      <AnswerGameProvider config={config}>
        <TestWithPlacement />
      </AnswerGameProvider>,
    );
    expect(
      screen.getByRole('listitem', { name: 'Slot 1, filled with 1' }),
    ).toBeInTheDocument();
  });
});
