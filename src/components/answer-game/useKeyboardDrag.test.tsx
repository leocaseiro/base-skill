import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useKeyboardDrag } from './useKeyboardDrag';
import type { AnswerGameConfig } from './types';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

const gameConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

const KeyboardDragHarness = () => {
  const { pickedUpTileId, keyboardDragRef } = useKeyboardDrag();
  return (
    <div ref={keyboardDragRef} data-testid="container">
      <div
        data-tile-id="t1"
        tabIndex={0}
        data-testid="tile"
        role="button"
        aria-label="Tile A"
      >
        A
      </div>
      <div data-testid="status">{pickedUpTileId ?? 'none'}</div>
    </div>
  );
};

describe('useKeyboardDrag', () => {
  it('pressing Space on a tile element picks it up', () => {
    render(
      <AnswerGameProvider config={gameConfig}>
        <KeyboardDragHarness />
      </AnswerGameProvider>,
    );
    const tile = screen.getByTestId('tile');
    fireEvent.keyDown(tile, { key: ' ', code: 'Space' });
    expect(screen.getByTestId('status')).toHaveTextContent('t1');
  });

  it('pressing Escape cancels pickup', () => {
    render(
      <AnswerGameProvider config={gameConfig}>
        <KeyboardDragHarness />
      </AnswerGameProvider>,
    );
    const tile = screen.getByTestId('tile');
    fireEvent.keyDown(tile, { key: ' ', code: 'Space' });
    expect(screen.getByTestId('status')).toHaveTextContent('t1');
    fireEvent.keyDown(tile, { key: 'Escape', code: 'Escape' });
    expect(screen.getByTestId('status')).toHaveTextContent('none');
  });
});
