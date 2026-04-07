import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from '../AnswerGameProvider';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { SentenceWithGaps } from './SentenceWithGaps';
import type { AnswerGameConfig, AnswerZone, TileItem } from '../types';
import type { ReactNode } from 'react';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  queueSound: vi.fn(),
  whenSoundEnds: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  dropTargetForElements: vi.fn().mockReturnValue(() => {}),
  draggable: vi.fn().mockReturnValue(() => {}),
}));

const tiles: TileItem[] = [
  { id: 'tile-1', label: 'cat', value: 'cat' },
  { id: 'tile-2', label: 'mat', value: 'mat' },
];

const emptyZones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'cat',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'mat',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const baseConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const createWrapper = (
  config: AnswerGameConfig,
  zones: AnswerZone[] = emptyZones,
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const dispatch = useAnswerGameDispatch();
    useEffect(() => {
      dispatch({ type: 'INIT_ROUND', tiles, zones });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- stable test fixture
    return <>{children}</>;
  };
  Wrapper.displayName = 'AnswerGameTestInner';

  const Provider = ({ children }: { children: ReactNode }) => (
    <AnswerGameProvider config={config}>
      <Wrapper>{children}</Wrapper>
    </AnswerGameProvider>
  );
  Provider.displayName = 'AnswerGameTestWrapper';
  return Provider;
};

describe('SentenceWithGaps', () => {
  it('renders text segments', () => {
    const Wrapper = createWrapper(baseConfig);
    render(
      <Wrapper>
        <SentenceWithGaps sentence="The {0} sat." />
      </Wrapper>,
    );
    expect(screen.getByText(/The/)).toBeInTheDocument();
    expect(screen.getByText(/sat\./)).toBeInTheDocument();
  });

  it('renders gap slots inline', () => {
    const Wrapper = createWrapper(baseConfig);
    render(
      <Wrapper>
        <SentenceWithGaps sentence="The {0} sat." />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Slot 1, empty')).toBeInTheDocument();
  });

  it('renders multiple gaps', () => {
    const Wrapper = createWrapper(baseConfig);
    render(
      <Wrapper>
        <SentenceWithGaps sentence="The {0} sat on the {1}." />
      </Wrapper>,
    );
    expect(screen.getByLabelText('Slot 1, empty')).toBeInTheDocument();
    expect(screen.getByLabelText('Slot 2, empty')).toBeInTheDocument();
  });
});
