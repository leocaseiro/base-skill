import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MatchingPairZones } from './MatchingPairZones';
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
  {
    id: 'z1',
    index: 1,
    expectedValue: '5',
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

describe('MatchingPairZones', () => {
  it('renders one drop zone per zone in context', () => {
    render(<MatchingPairZones />, { wrapper });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('empty zone has aria-label "Zone 1, empty"', () => {
    render(<MatchingPairZones />, { wrapper });
    expect(
      screen.getByRole('listitem', { name: 'Zone 1, empty' }),
    ).toBeInTheDocument();
  });
});
