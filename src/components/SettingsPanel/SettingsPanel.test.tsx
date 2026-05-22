import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { SettingsPanel } from './SettingsPanel';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { i18n } from '@/lib/i18n/i18n';
import { DbProvider } from '@/providers/DbProvider';

const renderSettingsPanel = (db: BaseSkillDatabase) =>
  render(
    <I18nextProvider i18n={i18n}>
      <DbProvider openDatabase={() => Promise.resolve(db)}>
        <SettingsPanel locale="en" onLocaleChange={vi.fn()} />
      </DbProvider>
    </I18nextProvider>,
  );

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
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
  vi.unstubAllGlobals();
});

describe('SettingsPanel', () => {
  it('renders sound effects volume slider with default 80%', () => {
    renderSettingsPanel(db);
    expect(
      screen.getByText(/sound effects \(80%\)/i),
    ).toBeInTheDocument();
  });

  it('renders voice volume slider with default 80%', () => {
    renderSettingsPanel(db);
    expect(screen.getByText(/voice \(80%\)/i)).toBeInTheDocument();
  });

  it('renders speech rate slider', () => {
    renderSettingsPanel(db);
    expect(screen.getByText(/speech rate/i)).toBeInTheDocument();
  });

  it('renders language select with current locale selected', () => {
    renderSettingsPanel(db);
    expect(screen.getByText(/language/i)).toBeInTheDocument();
  });

  it('renders voice select', () => {
    renderSettingsPanel(db);
    expect(screen.getByText(/^voice$/i)).toBeInTheDocument();
  });

  it('shows system default placeholder in voice select when no voice is saved', () => {
    renderSettingsPanel(db);
    expect(screen.getByText(/system default/i)).toBeInTheDocument();
  });

  it('renders tap forgiveness distance slider with default 17px', () => {
    renderSettingsPanel(db);
    expect(
      screen.getByText(/tap forgiveness — distance \(17px\)/i),
    ).toBeInTheDocument();
  });

  it('renders tap forgiveness duration slider with default 150ms', () => {
    renderSettingsPanel(db);
    expect(
      screen.getByText(/tap forgiveness — duration \(150ms\)/i),
    ).toBeInTheDocument();
  });

  it('shows inline warning when preferredVoiceURI is not in loaded voices', async () => {
    vi.stubGlobal('speechSynthesis', {
      getVoices: vi
        .fn()
        .mockReturnValue([
          { name: 'Samantha', lang: 'en-US', localService: true },
        ]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    await db.settings.insert({
      id: 'settings:anonymous',
      profileId: 'anonymous',
      preferredVoiceURI: 'FakeVoice',
      updatedAt: new Date().toISOString(),
    });
    renderSettingsPanel(db);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert').textContent).toMatch(
      /not available/i,
    );
  });
});
