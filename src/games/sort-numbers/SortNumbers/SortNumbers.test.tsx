import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SortNumbers } from './SortNumbers';
import type { SortNumbersConfig } from '../types';

const navigateStub = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateStub,
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  isSpeechActive: vi.fn().mockReturnValue(false),
}));
const noopUnsubscribe = () => {};
vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({
    emit: vi.fn(),
    subscribe: vi.fn(() => noopUnsubscribe),
  }),
}));
vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      speechRate: 1,
      volume: 0.8,
      preferredVoiceURI: undefined,
    },
    update: vi.fn(),
  }),
}));

vi.mock('@/lib/audio/AudioFeedback', () => ({
  playSound: vi.fn(),
  queueSound: vi.fn().mockImplementation(() => Promise.resolve()),
  whenSoundEnds: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock('canvas-confetti', () => ({
  default: Object.assign(
    vi.fn().mockImplementation(() => Promise.resolve()),
    { reset: vi.fn() },
  ),
}));

const baseConfig: SortNumbersConfig = {
  gameId: 'sort-numbers-test',
  component: 'SortNumbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  roundsInOrder: true,
  ttsEnabled: false,
  direction: 'ascending',
  range: { min: 1, max: 9 },
  quantity: 3,
  skip: { mode: 'consecutive' },
  distractors: { source: 'random', count: 0 },
  rounds: [{ sequence: [1, 2, 3] }],
};

describe('SortNumbers basic rendering', () => {
  it('renders three slots for a three-number sequence', () => {
    const { container } = render(<SortNumbers config={baseConfig} />);
    const zone = container.querySelector<HTMLElement>(
      '.game-answer-zone',
    )!;
    expect(within(zone).getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders the direction label', () => {
    render(<SortNumbers config={baseConfig} />);
    expect(
      screen.getByText('sort-numbers-ui.ascending-label'),
    ).toBeInTheDocument();
  });
});

describe('SortNumbers round-complete overlay', () => {
  // U4 coverage scope: this test verifies the engine-driven overlay
  // single-mount invariant under physical-keyboard input via the
  // `inputMethod: 'type'` shim. Touch-keyboard input (the primary
  // BaseSkill platform) drives via useTouchKeyboardInput on the hidden
  // input element and is covered by tests-e2e/sort-numbers.e2e.ts.
  it('mounts the round-complete effect exactly once during the celebration window', async () => {
    const config: SortNumbersConfig = {
      ...baseConfig,
      totalRounds: 3,
      inputMethod: 'type',
      rounds: [
        { sequence: [1, 2, 3] },
        { sequence: [4, 5, 6] },
        { sequence: [7, 8, 9] },
      ],
    };

    render(<SortNumbers config={config} />);

    // Type 1, 2, 3 — the keyboard adapter dispatches TYPE_TILE,
    // AnswerGameProvider mirrors to the engine, and the XState
    // `always(allFilledCorrectly)` transition fires once all three
    // slots are filled correctly. The roundComplete state's entry
    // mounts the celebration overlay exactly once.
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '1', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '2', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '3', bubbles: true }),
      );
    });

    const overlays = await screen.findAllByRole('status', {
      name: 'Round complete!',
    });
    expect(overlays).toHaveLength(1);
  });
});

describe('SortNumbers StrictMode round-advance guard', () => {
  // (review #5) StrictMode mounts effects twice in dev. Without the
  // `advancedRoundRef` guard the round-advance effect would fire two
  // ADVANCE_ROUND dispatches in dev, double-incrementing the engine's
  // roundIndex. With the guard the second invocation is short-circuited.
  it('round-advance dispatches once under StrictMode double-mount', () => {
    const config: SortNumbersConfig = {
      ...baseConfig,
      inputMethod: 'type',
      totalRounds: 2,
      rounds: [{ sequence: [1, 2, 3] }, { sequence: [4, 5, 6] }],
    };

    expect(() =>
      render(
        <StrictMode>
          <SortNumbers config={config} />
        </StrictMode>,
      ),
    ).not.toThrow();

    // Complete round 1 — must not bump roundIndex past 1.
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '1', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '2', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '3', bubbles: true }),
      );
    });

    // If the guard mis-fired, the engine would have advanced two rounds
    // (1 + StrictMode dup) and we'd see the gameOver overlay. Asserting
    // it is NOT present confirms we stayed on/around round 2.
    expect(
      screen.queryByRole('dialog', { name: 'Game complete' }),
    ).not.toBeInTheDocument();
  });
});

describe('SortNumbers Next Level idempotency', () => {
  // (review #4) Regression: two synchronous clicks on "Next Level" used
  // to fire ADVANCE_LEVEL twice, bumping levelIndex past where the
  // engine and reducer agreed. With the single-flight guard the second
  // click is swallowed.
  it('two synchronous clicks fire one ADVANCE_LEVEL', async () => {
    const user = userEvent.setup();
    const generateNextLevel = vi.fn().mockReturnValue({
      tiles: [
        { id: 'a', label: '4', value: '4' },
        { id: 'b', label: '5', value: '5' },
        { id: 'c', label: '6', value: '6' },
      ],
      zones: [
        {
          id: 'z0',
          index: 0,
          expectedValue: '4',
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
        {
          id: 'z2',
          index: 2,
          expectedValue: '6',
          placedTileId: null,
          isWrong: false,
          isLocked: false,
        },
      ],
    });

    const levelConfig: SortNumbersConfig = {
      ...baseConfig,
      inputMethod: 'type',
      totalRounds: 1,
      rounds: [{ sequence: [1, 2, 3] }],
      levelMode: {
        generateNextLevel,
      },
    };

    render(<SortNumbers config={levelConfig} />);

    // Complete level 1.
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '1', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '2', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '3', bubbles: true }),
      );
    });

    const nextLevel = await screen.findByRole('button', {
      name: /next level/i,
    });
    // Two fast clicks — the second must be ignored.
    await user.click(nextLevel);
    await user.click(nextLevel);

    // generateNextLevel runs once even if React schedules two clicks
    // before the next state flush.
    expect(generateNextLevel).toHaveBeenCalledTimes(1);
  });
});

describe('SortNumbers Play again', () => {
  it('resets the game to round 1 after game-over', async () => {
    const user = userEvent.setup();

    const oneRoundConfig: SortNumbersConfig = {
      ...baseConfig,
      inputMethod: 'type',
      rounds: [{ sequence: [1, 2, 3] }],
    };

    const { container } = render(
      <SortNumbers config={oneRoundConfig} />,
    );

    const answerZone = () =>
      container.querySelector<HTMLElement>('.game-answer-zone')!;
    expect(within(answerZone()).getAllByRole('listitem')).toHaveLength(
      3,
    );
    expect(
      screen.queryByRole('dialog', { name: 'Game complete' }),
    ).not.toBeInTheDocument();

    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '1', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '2', bubbles: true }),
      );
    });
    act(() => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: '3', bubbles: true }),
      );
    });

    const playAgain = await screen.findByRole('button', {
      name: 'Play again',
    });
    await user.click(playAgain);

    expect(
      screen.queryByRole('dialog', { name: 'Game complete' }),
    ).not.toBeInTheDocument();
    expect(within(answerZone()).getAllByRole('listitem')).toHaveLength(
      3,
    );
  });
});
