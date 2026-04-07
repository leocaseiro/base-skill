import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from '../AnswerGameProvider';
import { useAnswerGameDispatch } from '../useAnswerGameDispatch';
import { Slot } from './Slot';
import type { AnswerGameConfig, AnswerZone, TileItem } from '../types';
import type { SlotRenderProps } from './useSlotBehavior';
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
  { id: 'tile-1', label: 'A', value: 'A' },
  { id: 'tile-2', label: 'B', value: 'B' },
];

const emptyZones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'A',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'B',
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  },
];

const filledZones: AnswerZone[] = [
  {
    id: 'z0',
    index: 0,
    expectedValue: 'A',
    placedTileId: 'tile-1',
    isWrong: false,
    isLocked: false,
  },
  {
    id: 'z1',
    index: 1,
    expectedValue: 'B',
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

function createWrapper(
  config: AnswerGameConfig,
  zones: AnswerZone[] = emptyZones,
) {
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
}

describe('Slot', () => {
  it('renders as li by default', () => {
    const Wrapper = createWrapper(baseConfig);
    render(
      <Wrapper>
        <ol>
          <Slot index={0}>{() => null}</Slot>
        </ol>
      </Wrapper>,
    );
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('renders as span when as="span"', () => {
    const Wrapper = createWrapper(baseConfig);
    render(
      <Wrapper>
        <Slot index={0} as="span">
          {() => null}
        </Slot>
      </Wrapper>,
    );
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows empty label for unfilled slot', () => {
    const Wrapper = createWrapper(baseConfig, emptyZones);
    render(
      <Wrapper>
        <ol>
          <Slot index={0}>
            {({ label }: SlotRenderProps) => (
              <span>{label ?? 'empty'}</span>
            )}
          </Slot>
        </ol>
      </Wrapper>,
    );
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('shows tile label for filled slot', () => {
    const Wrapper = createWrapper(baseConfig, filledZones);
    render(
      <Wrapper>
        <ol>
          <Slot index={0}>
            {({ label }: SlotRenderProps) => <span>{label}</span>}
          </Slot>
        </ol>
      </Wrapper>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('applies className to the slot element', () => {
    const Wrapper = createWrapper(baseConfig);
    render(
      <Wrapper>
        <ol>
          <Slot index={0} className="size-14 rounded-lg">
            {() => null}
          </Slot>
        </ol>
      </Wrapper>,
    );
    // className is forwarded to the inner visual div, not the outer listitem wrapper
    const inner = screen.getByRole('listitem')
      .firstElementChild as HTMLElement;
    expect(inner).toHaveClass('size-14');
    expect(inner).toHaveClass('rounded-lg');
  });

  it('has correct aria-label when empty', () => {
    const Wrapper = createWrapper(baseConfig, emptyZones);
    render(
      <Wrapper>
        <ol>
          <Slot index={0}>{() => null}</Slot>
        </ol>
      </Wrapper>,
    );
    expect(screen.getByRole('listitem')).toHaveAttribute(
      'aria-label',
      'Slot 1, empty',
    );
  });

  it('has correct aria-label when filled', () => {
    const Wrapper = createWrapper(baseConfig, filledZones);
    render(
      <Wrapper>
        <ol>
          <Slot index={0}>{() => null}</Slot>
        </ol>
      </Wrapper>,
    );
    expect(screen.getByRole('listitem')).toHaveAttribute(
      'aria-label',
      'Slot 1, filled with A',
    );
  });
});
