// src/routes/$locale/_app/game/$gameId.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { GameRoute } from './$gameId';
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
  rounds: [{ id: 'r1', prompt: { en: 'Q' }, correctAnswer: 'A' }],
};

const testConfig: ResolvedGameConfig = {
  gameId: 'word-builder',
  title: { en: 'Word Builder' },
  gradeBand: 'year1-2',
  maxRounds: 3,
  maxRetries: 1,
  maxUndoDepth: 3,
  timerVisible: false,
  timerDurationSeconds: null,
  difficulty: 'medium',
};

const testState: GameEngineState = {
  phase: 'instructions',
  roundIndex: 0,
  score: 0,
  streak: 0,
  retryCount: 0,
  content,
  currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
};

const testMeta: SessionMeta = {
  profileId: 'prof-route',
  gameId: 'word-builder',
  gradeBand: 'year1-2',
  seed: 'seed-route',
  initialContent: content,
  initialState: testState,
};

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <DbProvider openDatabase={() => Promise.resolve(db)}>
      {children}
    </DbProvider>
  );
}

describe('GameRoute', () => {
  it('renders the game shell with title from loaderData', async () => {
    render(
      <GameRoute
        config={testConfig}
        initialLog={null}
        draftState={null}
        sessionId="sess-route-001"
        seed="seed-route"
        meta={testMeta}
        gameSpecificConfig={null}
        bookmarkId={null}
        bookmarkName={null}
        bookmarkColor={null}
      />,
      { wrapper },
    );
    await waitFor(() => {
      expect(screen.getByText('Word Builder')).toBeInTheDocument();
    });
  });

  it('renders game shell chrome (score visible)', async () => {
    render(
      <GameRoute
        config={testConfig}
        initialLog={null}
        draftState={null}
        sessionId="sess-route-001"
        seed="seed-route"
        meta={testMeta}
        gameSpecificConfig={null}
        bookmarkId={null}
        bookmarkName={null}
        bookmarkColor={null}
      />,
      { wrapper },
    );
    await waitFor(() => {
      expect(screen.getByTestId('game-score')).toBeInTheDocument();
    });
  });
});
