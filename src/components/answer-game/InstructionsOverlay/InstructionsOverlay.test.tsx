// src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { InstructionsOverlay } from './InstructionsOverlay';
import type { BaseSkillDatabase } from '@/db/types';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { i18n } from '@/lib/i18n/i18n';
import { DbProvider } from '@/providers/DbProvider';
import { ThemeRuntimeProvider } from '@/providers/ThemeRuntimeProvider';

const { navigate, invalidate } = vi.hoisted(() => ({
  navigate: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const original =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...original,
    useNavigate: () => navigate,
    useRouter: () => ({ invalidate }),
  };
});

const baseProps = {
  text: 'Test instructions for the game.',
  onStart: () => {},
  ttsEnabled: false,
  gameTitle: 'Sort Numbers',
  gameId: 'sort-numbers' as const,
  customGameColor: 'indigo' as const,
  config: { totalRounds: 5 } as Record<string, unknown>,
  onConfigChange: () => {},
  onSaveCustomGame: async () => 'stub-id',
  existingCustomGameNames: [] as readonly string[],
};

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  cleanup();
  await destroyTestDatabase(db);
});

describe('InstructionsOverlay', () => {
  it('portals a full-viewport z-40 layer so GameShell can stack the exit control above (z-45)', () => {
    render(
      <DbProvider openDatabase={() => Promise.resolve(db)}>
        <I18nextProvider i18n={i18n}>
          <ThemeRuntimeProvider>
            <InstructionsOverlay {...baseProps} />
          </ThemeRuntimeProvider>
        </I18nextProvider>
      </DbProvider>,
    );

    const root = screen.getByRole('dialog', {
      name: 'Game instructions',
    });
    expect(root).toHaveClass('z-40', 'fixed', 'inset-0');
  });
});
