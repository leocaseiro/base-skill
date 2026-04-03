import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AnswerGameProvider } from './AnswerGameProvider';
import { useAnswerGameContext } from './useAnswerGameContext';
import { useAnswerGameDispatch } from './useAnswerGameDispatch';
import type { AnswerGameConfig } from './types';

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
});
