// src/routes/$locale/_app/index.test.tsx
import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { HomeScreen } from './index';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { ANONYMOUS_PROFILE_ID } from '@/db/last-session-game-config';
import { ensureAppMetaSingleton } from '@/db/migrations';
import { i18n } from '@/lib/i18n/i18n';
import { DbProvider } from '@/providers/DbProvider';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const original =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory requires inline import() type
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...original,
    useParams: () => ({ locale: 'en' }),
    // eslint-disable-next-line unicorn/no-useless-undefined -- mockResolvedValue requires explicit argument
    useNavigate: () => vi.fn().mockResolvedValue(undefined),
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

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
  // Seeder reads/writes app_meta.singleton; production migrations create this
  // row, but createTestDatabase does not run them.
  await ensureAppMetaSingleton(db);
});

afterEach(async () => {
  // Unmount before tearing down the DB so RxDB subscriptions don't fire
  // against a destroyed instance.
  cleanup();
  await destroyTestDatabase(db);
});

const renderHome = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <DbProvider openDatabase={() => Promise.resolve(db)}>
        <HomeScreen />
      </DbProvider>
    </I18nextProvider>,
  );

describe('Home route — seeds The Floor is Lava on first launch', () => {
  it(
    'shows the seeded "The Floor is Lava" card on first render',
    { timeout: 10_000 },
    async () => {
      renderHome();
      await waitFor(() => {
        expect(
          screen.getByText('The Floor is Lava'),
        ).toBeInTheDocument();
      });
    },
  );

  it(
    'does not re-seed on second render',
    { timeout: 10_000 },
    async () => {
      const { rerender } = renderHome();
      await waitFor(() => {
        expect(
          screen.getByText('The Floor is Lava'),
        ).toBeInTheDocument();
      });
      rerender(
        <I18nextProvider i18n={i18n}>
          <DbProvider openDatabase={() => Promise.resolve(db)}>
            <HomeScreen />
          </DbProvider>
        </I18nextProvider>,
      );
      // Allow any potential re-seed to resolve before asserting the card count.
      await waitFor(async () => {
        const rows = await db.custom_games
          .find({
            selector: {
              profileId: ANONYMOUS_PROFILE_ID,
              name: 'The Floor is Lava',
            },
          })
          .exec();
        expect(rows).toHaveLength(1);
      });
      const cards = screen.getAllByText('The Floor is Lava');
      expect(cards).toHaveLength(1);
    },
  );
});
