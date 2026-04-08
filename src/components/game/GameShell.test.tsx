// src/components/game/GameShell.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { GameShell } from './GameShell';
import type { BaseSkillDatabase } from '@/db/types';
import type {
  GameEngineState,
  ResolvedContent,
  ResolvedGameConfig,
  SessionMeta,
} from '@/lib/game-engine/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';

// Mock TanStack Router navigate
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory requires inline import() type
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ locale: 'en', gameId: 'word-builder' }),
  };
});

const content: ResolvedContent = {
  rounds: [
    { id: 'r1', prompt: { en: 'Q1' }, correctAnswer: 'A' },
    { id: 'r2', prompt: { en: 'Q2' }, correctAnswer: 'B' },
  ],
};

const baseConfig: ResolvedGameConfig = {
  gameId: 'word-builder',
  title: { en: 'Word Builder' },
  gradeBand: 'year1-2',
  maxRounds: 2,
  maxRetries: 1,
  maxUndoDepth: 3,
  timerVisible: true,
  timerDurationSeconds: 60,
  difficulty: 'medium',
};

const initialState: GameEngineState = {
  phase: 'playing',
  roundIndex: 1, // round 2 of 2 (1-indexed display)
  score: 3,
  streak: 1,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r2', answer: null, hintsUsed: 0 },
};

const meta: SessionMeta = {
  profileId: 'prof-shell',
  gameId: 'word-builder',
  gradeBand: 'year1-2',
  seed: 'seed-shell',
  initialContent: content,
  initialState,
};

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

function renderShell(
  configOverride?: Partial<ResolvedGameConfig>,
  children?: ReactNode,
) {
  const config = { ...baseConfig, ...configOverride };
  return render(
    <DbProvider openDatabase={() => Promise.resolve(db)}>
      <GameShell
        config={config}
        moves={{}}
        initialState={initialState}
        sessionId="sess-shell-001"
        meta={meta}
      >
        {children ?? <div data-testid="game-content">Game Here</div>}
      </GameShell>
    </DbProvider>,
  );
}

describe('GameShell', () => {
  it('renders game title in top bar', () => {
    renderShell();
    expect(screen.getByText('Word Builder')).toBeInTheDocument();
  });

  it('renders round counter (1-indexed)', () => {
    renderShell();
    // roundIndex=1 → round display = 2
    expect(screen.getByTestId('game-round')).toBeInTheDocument();
  });

  it('renders score in sub-bar', () => {
    renderShell();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders timer when timerVisible is true', () => {
    renderShell({ timerVisible: true });
    expect(screen.getByTestId('game-timer')).toBeInTheDocument();
  });

  it('hides timer when timerVisible is false', () => {
    renderShell({ timerVisible: false });
    expect(screen.queryByTestId('game-timer')).not.toBeInTheDocument();
  });

  it('renders undo button when maxUndoDepth is non-zero', () => {
    renderShell({ maxUndoDepth: 3 });
    expect(
      screen.getByRole('button', { name: /undo/i }),
    ).toBeInTheDocument();
  });

  it('hides undo button when maxUndoDepth is 0', () => {
    renderShell({ maxUndoDepth: 0 });
    expect(
      screen.queryByRole('button', { name: /undo/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the game component children', () => {
    renderShell();
    expect(screen.getByTestId('game-content')).toBeInTheDocument();
  });

  it('renders Exit button in footer', () => {
    renderShell();
    expect(
      screen.getByRole('button', { name: /exit/i }),
    ).toBeInTheDocument();
  });

  it('opens exit confirmation dialog when Exit is clicked', async () => {
    renderShell();
    await userEvent.click(
      screen.getByRole('button', { name: /exit/i }),
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(
      screen.getByText(/want to leave the game/i),
    ).toBeInTheDocument();
  });

  it('opens exit confirmation dialog when header Back is clicked', async () => {
    renderShell();
    await userEvent.click(
      screen.getByRole('button', { name: /back/i }),
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('closes dialog when Keep Playing is clicked', async () => {
    renderShell();
    await userEvent.click(
      screen.getByRole('button', { name: /exit/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /keep playing/i }),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('marks session abandoned in DB when Leave Game is clicked', async () => {
    renderShell();
    await userEvent.click(
      screen.getByRole('button', { name: /exit/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /leave game/i }),
    );

    // Session should be abandoned in DB
    const index = await db.session_history_index
      .findOne('sess-shell-001')
      .exec();
    expect(index?.status).toBe('abandoned');
  });
});
