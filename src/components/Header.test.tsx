// src/components/Header.test.tsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Header } from './Header';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { i18n } from '@/lib/i18n/i18n';
import { DbProvider } from '@/providers/DbProvider';

const { mockPathname } = vi.hoisted(() => ({
  mockPathname: vi.fn(() => '/en/'),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const original =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...original,
    useParams: () => ({ locale: 'en' }),
    useLocation: () => ({ pathname: mockPathname() }),
    useNavigate: () => vi.fn(),
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

const renderHeader = (db: BaseSkillDatabase) =>
  render(
    <I18nextProvider i18n={i18n}>
      <DbProvider openDatabase={() => Promise.resolve(db)}>
        <Header />
      </DbProvider>
    </I18nextProvider>,
  );

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
  mockPathname.mockReturnValue('/en/');
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

describe('Header', () => {
  it('renders nothing on in-app game session paths (fullscreen, no app chrome)', () => {
    mockPathname.mockReturnValue('/en/game/word-spell');
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <Header />
      </I18nextProvider>,
    );
    expect(container.querySelector('header')).toBeNull();
    expect(
      screen.queryByRole('textbox', { name: 'Search games...' }),
    ).not.toBeInTheDocument();
  });

  it('renders the app shell header when not in a game session', () => {
    mockPathname.mockReturnValue('/en/');
    renderHeader(db);
    expect(screen.getByText('BaseSkill')).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Search games...' }),
    ).toBeInTheDocument();
  });
});
