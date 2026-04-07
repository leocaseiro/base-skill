import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useTouchKeyboard } from './TouchKeyboardContext';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import type { AnswerGameConfig, AnswerGameDraftState } from './types';

const gameConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const StateReader = () => {
  const state = useAnswerGameContext();
  return <div data-testid="phase">{state.phase}</div>;
};

const Dispatcher = () => {
  const dispatch = useAnswerGameDispatch();
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'COMPLETE_GAME' })}
    >
      end
    </button>
  );
};

describe('AnswerGameProvider', () => {
  it('provides initial state to children', () => {
    render(
      <AnswerGameProvider config={gameConfig}>
        <StateReader />
      </AnswerGameProvider>,
    );
    expect(screen.getByTestId('phase')).toHaveTextContent('playing');
  });

  it('dispatch updates state', async () => {
    const user = userEvent.setup();
    render(
      <AnswerGameProvider config={gameConfig}>
        <StateReader />
        <Dispatcher />
      </AnswerGameProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'end' }));
    expect(screen.getByTestId('phase')).toHaveTextContent('game-over');
  });

  it('useAnswerGameContext throws outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<StateReader />)).toThrow(
      'useAnswerGameContext must be used inside AnswerGameProvider',
    );
    console.error = consoleError;
  });

  it('useAnswerGameDispatch throws outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => render(<Dispatcher />)).toThrow(
      'useAnswerGameDispatch must be used inside AnswerGameProvider',
    );
    console.error = consoleError;
  });

  it('provides null TouchKeyboardContext on non-touch devices', () => {
    const FocusReader = () => {
      const focusKeyboard = useTouchKeyboard();
      return (
        <div data-testid="has-focus">
          {focusKeyboard === null ? 'null' : 'fn'}
        </div>
      );
    };

    render(
      <AnswerGameProvider
        config={{ ...gameConfig, inputMethod: 'type' }}
      >
        <FocusReader />
      </AnswerGameProvider>,
    );

    expect(screen.getByTestId('has-focus')).toHaveTextContent('null');
  });

  it('initialises from initialState when provided', () => {
    const draft: AnswerGameDraftState = {
      allTiles: [
        { id: 't-c', label: 'c', value: 'c' },
        { id: 't-a', label: 'a', value: 'a' },
        { id: 't-t', label: 't', value: 't' },
      ],
      bankTileIds: ['t-t'],
      zones: [
        {
          id: 'z1',
          index: 0,
          expectedValue: 'c',
          placedTileId: 't-c',
          isWrong: false,
          isLocked: false,
        },
        {
          id: 'z2',
          index: 1,
          expectedValue: 'a',
          placedTileId: 't-a',
          isWrong: false,
          isLocked: false,
        },
        {
          id: 'z3',
          index: 2,
          expectedValue: 't',
          placedTileId: null,
          isWrong: false,
          isLocked: false,
        },
      ],
      activeSlotIndex: 2,
      phase: 'playing',
      roundIndex: 0,
      retryCount: 0,
    };

    const BankReader = () => {
      const state = useAnswerGameContext();
      return (
        <div data-testid="bank">{state.bankTileIds.join(',')}</div>
      );
    };

    render(
      <AnswerGameProvider config={gameConfig} initialState={draft}>
        <BankReader />
      </AnswerGameProvider>,
    );

    expect(screen.getByTestId('bank')).toHaveTextContent('t-t');
  });

  it('skips INIT_ROUND effect when initialState is provided', async () => {
    const draft: AnswerGameDraftState = {
      allTiles: [{ id: 'x', label: 'x', value: 'x' }],
      bankTileIds: ['x'],
      zones: [],
      activeSlotIndex: 0,
      phase: 'playing',
      roundIndex: 0,
      retryCount: 0,
    };

    const cfgWithTiles: AnswerGameConfig = {
      ...gameConfig,
      initialTiles: [{ id: 'y', label: 'y', value: 'y' }],
      initialZones: [],
    };

    const BankReader = () => {
      const state = useAnswerGameContext();
      return (
        <div data-testid="bank">{state.bankTileIds.join(',')}</div>
      );
    };

    render(
      <AnswerGameProvider config={cfgWithTiles} initialState={draft}>
        <BankReader />
      </AnswerGameProvider>,
    );

    // Should still show draft bankTileIds ('x'), not the config tiles ('y')
    expect(screen.getByTestId('bank')).toHaveTextContent('x');
  });
});
