// src/routes/$locale/_app/game/$gameId.test.tsx
import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
import { ANONYMOUS_PROFILE_ID } from '@/db/last-session-game-config';
import { DbProvider } from '@/providers/DbProvider';

// eslint-disable-next-line unicorn/no-useless-undefined -- mockResolvedValue requires an explicit argument
const mockNavigate = vi.fn().mockResolvedValue(undefined);

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory requires inline import() type
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/en/game/word-builder',
    }),
    useParams: () => ({ locale: 'en', gameId: 'word-builder' }),
    Link: ({
      children,
      className,
      to: _to,
    }: {
      children?: ReactNode;
      className?: string;
      to: string;
    }): ReactNode => (
      <a className={className} href="http://test/">
        {children}
      </a>
    ),
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
  // Unmount all rendered components before destroying the db so that
  // hook cleanup effects (e.g. usePersistLastGameConfig flush-on-unmount)
  // resolve against the live db instead of a destroyed one.
  cleanup();
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
  it('renders the game shell with exit control from loaderData', async () => {
    render(
      <GameRoute
        config={testConfig}
        initialLog={null}
        draftState={null}
        sessionId="sess-route-001"
        seed="seed-route"
        meta={testMeta}
        gameSpecificConfig={null}
        customGameId={null}
        customGameName={null}
        customGameColor={null}
        customGameCover={null}
        persistedContent={null}
      />,
      { wrapper },
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /exit/i }),
      ).toBeInTheDocument();
    });
  });

  it(
    'deletes a custom game: removes doc from DB and triggers navigation',
    { timeout: 15_000 },
    async () => {
      const user = userEvent.setup();

      // Insert a custom game document into the DB
      const customId = 'custom-game-test-id';
      await db.custom_games.insert({
        id: customId,
        profileId: ANONYMOUS_PROFILE_ID,
        gameId: 'word-spell',
        name: 'My Custom Spelling',
        config: { component: 'WordSpell' },
        color: 'amber',
        createdAt: new Date().toISOString(),
      });

      const wordSpellConfig: ResolvedGameConfig = {
        ...testConfig,
        gameId: 'word-spell',
      };

      render(
        <GameRoute
          config={wordSpellConfig}
          initialLog={null}
          draftState={null}
          sessionId="sess-delete-001"
          seed="seed-delete"
          meta={{ ...testMeta, gameId: 'word-spell' }}
          gameSpecificConfig={{ component: 'WordSpell' }}
          customGameId={customId}
          customGameName="My Custom Spelling"
          customGameColor="amber"
          customGameCover={null}
          persistedContent={null}
        />,
        { wrapper },
      );

      // Wait for the InstructionsOverlay to render (cog/settings button)
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /configure/i }),
        ).toBeInTheDocument();
      });

      // Open the AdvancedConfigModal via the cog button
      await user.click(
        screen.getByRole('button', { name: /configure/i }),
      );

      // Click the Delete button (in the AdvancedConfigModal) to open the confirmation dialog
      const deleteBtn = await screen.findByRole('button', {
        name: /^delete$/i,
      });
      await user.click(deleteBtn);

      // After the confirmation dialog opens, Radix marks the parent dialog as
      // aria-hidden, leaving only the confirmation's Delete button accessible.
      // findByRole will locate the destructive confirm button.
      const confirmDeleteBtn = await screen.findByRole('button', {
        name: /^delete$/i,
      });
      await user.click(confirmDeleteBtn);

      // The document must be removed from the DB
      await waitFor(async () => {
        const doc = await db.custom_games.findOne(customId).exec();
        expect(doc).toBeNull();
      });

      // Navigation must strip configId from search params — expect.any returns
      // AsymmetricMatcher typed as any, so we suppress the unsafe-assignment rule.
      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.any() returns AsymmetricMatcher typed as any */
      const navigateArg = expect.objectContaining({
        search: expect.any(Function),
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment -- end of suppress block */
      expect(mockNavigate).toHaveBeenCalledWith(navigateArg);
    },
  );
});
