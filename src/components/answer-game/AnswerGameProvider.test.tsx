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

  it('provides TouchKeyboardContext focusKeyboard fn for type mode on all devices', () => {
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

    expect(screen.getByTestId('has-focus')).toHaveTextContent('fn');
  });

  it('provides null TouchKeyboardContext for drag mode', () => {
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
        config={{ ...gameConfig, inputMethod: 'drag' }}
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
      levelIndex: 0,
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

  it('prefers draft tiles over config initialTiles when resuming', async () => {
    const draft: AnswerGameDraftState = {
      allTiles: [{ id: 'x', label: 'x', value: 'x' }],
      bankTileIds: ['x'],
      zones: [],
      activeSlotIndex: 0,
      phase: 'playing',
      roundIndex: 0,
      retryCount: 0,
      levelIndex: 0,
    };

    const cfgWithTiles: AnswerGameConfig = {
      ...gameConfig,
      initialTiles: [{ id: 'y', label: 'y', value: 'y' }],
      initialZones: [
        {
          id: 'zy',
          index: 0,
          expectedValue: 'y',
          placedTileId: null,
          isWrong: false,
          isLocked: false,
        },
      ],
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

    // Resuming dispatches RESUME_ROUND instead of INIT_ROUND, so the draft
    // bankTileIds ('x') win over the config's initialTiles ('y').
    expect(screen.getByTestId('bank')).toHaveTextContent('x');
  });

  it('preserves draft progress counters on mount (RESUME_ROUND path)', () => {
    // Regression guard: INIT_ROUND would reset `roundIndex`/`retryCount` to 0.
    // The provider must dispatch `RESUME_ROUND` on resume so mid-session
    // progress survives the mount effect.
    const draft: AnswerGameDraftState = {
      allTiles: [
        { id: 'a', label: 'a', value: 'a' },
        { id: 'b', label: 'b', value: 'b' },
      ],
      bankTileIds: ['b'],
      zones: [
        {
          id: 'z0',
          index: 0,
          expectedValue: 'a',
          placedTileId: 'a',
          isWrong: false,
          isLocked: false,
        },
      ],
      activeSlotIndex: 0,
      phase: 'playing',
      roundIndex: 4,
      retryCount: 3,
      levelIndex: 1,
    };

    const ProgressReader = () => {
      const state = useAnswerGameContext();
      return (
        <div data-testid="progress">
          {`${state.roundIndex}/${state.retryCount}/${state.levelIndex}`}
        </div>
      );
    };

    render(
      <AnswerGameProvider config={gameConfig} initialState={draft}>
        <ProgressReader />
      </AnswerGameProvider>,
    );

    expect(screen.getByTestId('progress')).toHaveTextContent('4/3/1');
  });

  it('applies a changed initialState via RESUME_ROUND across re-renders', () => {
    const firstDraft: AnswerGameDraftState = {
      allTiles: [{ id: 'first', label: 'f', value: 'f' }],
      bankTileIds: ['first'],
      zones: [],
      activeSlotIndex: 0,
      phase: 'playing',
      roundIndex: 0,
      retryCount: 0,
      levelIndex: 0,
    };
    const secondDraft: AnswerGameDraftState = {
      ...firstDraft,
      allTiles: [{ id: 'second', label: 's', value: 's' }],
      bankTileIds: ['second'],
      roundIndex: 2,
    };

    const ProgressReader = () => {
      const state = useAnswerGameContext();
      return (
        <div data-testid="info">
          {state.bankTileIds.join(',')}|{state.roundIndex}
        </div>
      );
    };

    const { rerender } = render(
      <AnswerGameProvider config={gameConfig} initialState={firstDraft}>
        <ProgressReader />
      </AnswerGameProvider>,
    );
    expect(screen.getByTestId('info')).toHaveTextContent('first|0');

    rerender(
      <AnswerGameProvider
        config={gameConfig}
        initialState={secondDraft}
      >
        <ProgressReader />
      </AnswerGameProvider>,
    );
    // A changed draft must flow through — pre-hardening the provider
    // short-circuited the effect and left the old state in place.
    expect(screen.getByTestId('info')).toHaveTextContent('second|2');
  });
});
