// src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
import {
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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
import type { JSX } from 'react';
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

let db: BaseSkillDatabase;

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  cleanup();
  await destroyTestDatabase(db);
});

const wrapper = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => (
  <DbProvider openDatabase={() => Promise.resolve(db)}>
    <I18nextProvider i18n={i18n}>
      <ThemeRuntimeProvider>{children}</ThemeRuntimeProvider>
    </I18nextProvider>
  </DbProvider>
);

const legacyBaseProps = {
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

type BaseProps = Parameters<typeof InstructionsOverlay>[0];

const baseProps = (overrides: Partial<BaseProps> = {}): BaseProps => ({
  text: 'Instructions',
  onStart: vi.fn(),
  ttsEnabled: false,
  gameTitle: 'Game',
  gameId: 'sort-numbers',
  config: {},
  onConfigChange: vi.fn(),
  onSaveCustomGame: vi.fn(async () => 'new-id'),
  existingCustomGameNames: [],
  ...overrides,
});

const applySimpleEdit = async (
  user: ReturnType<typeof userEvent.setup>,
  gameId: 'word-spell' | 'sort-numbers' | 'number-match',
  edit: Record<string, unknown>,
): Promise<void> => {
  if (gameId === 'sort-numbers' && 'direction' in edit) {
    // SortNumbersSimpleConfigForm uses ChunkGroup with aria-label="Going Down!" for descending
    await user.click(
      screen.getByRole('button', {
        name: /going.?down/i,
      }),
    );
    return;
  }
  if ('inputMethod' in edit) {
    const target = edit.inputMethod as string;
    await user.click(
      screen.getByRole('button', { name: new RegExp(target, 'i') }),
    );
    return;
  }
  throw new Error(
    `No simple-edit driver for ${gameId} ${JSON.stringify(edit)}`,
  );
};

const expectSimpleReflects = (
  gameId: 'word-spell' | 'sort-numbers' | 'number-match',
  edit: Record<string, unknown>,
): void => {
  // When AdvancedConfigModal is open, it traps accessibility outside.
  // Check within the open dialog for config state; fall back to screen for simple form.
  const advancedDialog = screen.queryByRole('dialog', {
    name: /advanced settings/i,
  });
  if (advancedDialog) {
    // Modal is open: check the advanced modal's select fields
    const scope = within(advancedDialog);
    if (gameId === 'sort-numbers' && edit.direction === 'descending') {
      const select = scope.getByRole('combobox', {
        name: /direction/i,
      });
      expect((select as HTMLSelectElement).value).toBe('descending');
      return;
    }
    if ('inputMethod' in edit) {
      const select = scope.getByRole('combobox', {
        name: /input method/i,
      });
      expect((select as HTMLSelectElement).value).toBe(
        String(edit.inputMethod),
      );
    }
    return;
  }
  // Modal is closed: check the simple form's ChunkGroup toggle buttons
  if (gameId === 'sort-numbers' && edit.direction === 'descending') {
    expect(
      screen.getByRole('button', {
        name: /going.?down/i,
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    return;
  }
  if ('inputMethod' in edit) {
    expect(
      screen.getByRole('button', {
        name: new RegExp(String(edit.inputMethod), 'i'),
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
};

const expectAdvancedReflects = (
  gameId: 'word-spell' | 'sort-numbers' | 'number-match',
  edit: Record<string, unknown>,
): void => {
  // Delegates to expectSimpleReflects; when the modal is open, that helper
  // automatically queries within the AdvancedConfigModal dialog instead of
  // the aria-hidden simple form.
  expectSimpleReflects(gameId, edit);
};

describe('InstructionsOverlay', () => {
  it('portals a full-viewport z-40 layer so GameShell can stack the exit control above (z-45)', () => {
    render(
      <DbProvider openDatabase={() => Promise.resolve(db)}>
        <I18nextProvider i18n={i18n}>
          <ThemeRuntimeProvider>
            <InstructionsOverlay {...legacyBaseProps} />
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

describe.each([
  {
    gameId: 'word-spell' as const,
    initialConfig: {
      component: 'WordSpell',
      mode: 'recall',
      inputMethod: 'drag',
    },
    simpleEdit: { inputMethod: 'type' },
  },
  {
    gameId: 'sort-numbers' as const,
    initialConfig: {
      component: 'SortNumbers',
      direction: 'ascending',
      configMode: 'simple',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      inputMethod: 'drag',
    },
    simpleEdit: { direction: 'descending' },
  },
  {
    gameId: 'number-match' as const,
    initialConfig: {
      component: 'NumberMatch',
      mode: 'numeral-to-group',
      inputMethod: 'drag',
      range: { min: 1, max: 12 },
      tileBankMode: 'distractors',
      distractorCount: 2,
      rounds: [{ value: 3 }],
      totalRounds: 1,
    },
    simpleEdit: { inputMethod: 'type' },
  },
])(
  'InstructionsOverlay state-sync ($gameId)',
  ({ gameId, initialConfig, simpleEdit }) => {
    it('forwards simple-form edits up via onConfigChange', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      render(
        <InstructionsOverlay
          {...baseProps({ gameId, config: initialConfig })}
          onConfigChange={onConfigChange}
        />,
        { wrapper },
      );
      await applySimpleEdit(user, gameId, simpleEdit);
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining(simpleEdit),
      );
    });

    it('opening the cog reflects the current draft (simple → advanced)', async () => {
      const user = userEvent.setup();
      render(
        <InstructionsOverlay
          {...baseProps({
            gameId,
            config: { ...initialConfig, ...simpleEdit },
          })}
        />,
        { wrapper },
      );
      await user.click(
        screen.getByRole('button', { name: /configure/i }),
      );
      expectAdvancedReflects(gameId, simpleEdit);
    });

    it('Discard reverts both simple and advanced views to the modal-open snapshot', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      const Harness = (): JSX.Element => {
        const [config, setConfig] =
          useState<Record<string, unknown>>(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({ gameId, config })}
            onConfigChange={(c) => {
              setConfig(c);
              onConfigChange(c);
            }}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /configure/i }),
      );
      await user.type(
        screen.getByPlaceholderText(/skip by 2/i),
        'Tweaked',
      );
      await user.click(
        screen.getAllByRole('button', { name: /cancel/i }).at(-1)!,
      );
      await user.click(
        screen.getByRole('button', { name: /configure/i }),
      );
      const nameInput = screen.getByPlaceholderText(/skip by 2/i);
      expect((nameInput as HTMLInputElement).value).toBe('');
      expectSimpleReflects(gameId, simpleEdit);
    });

    it('re-initializes draft when customGameId changes', async () => {
      const { rerender } = render(
        <InstructionsOverlay
          {...baseProps({
            gameId,
            config: initialConfig,
            customGameId: 'A',
            customGameName: 'Custom A',
          })}
        />,
        { wrapper },
      );
      rerender(
        <InstructionsOverlay
          {...baseProps({
            gameId,
            config: { ...initialConfig, ...simpleEdit },
            customGameId: 'B',
            customGameName: 'Custom B',
          })}
        />,
      );
      expect(screen.getByText('Custom B')).toBeInTheDocument();
    });
  },
);

describe.each([
  {
    gameId: 'word-spell' as const,
    initialConfig: {
      component: 'WordSpell',
      mode: 'recall',
      inputMethod: 'drag',
    },
    simpleEdit: { inputMethod: 'type' },
  },
  {
    gameId: 'sort-numbers' as const,
    initialConfig: {
      component: 'SortNumbers',
      direction: 'ascending',
      configMode: 'simple',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      inputMethod: 'drag',
    },
    simpleEdit: { direction: 'descending' },
  },
  {
    gameId: 'number-match' as const,
    initialConfig: {
      component: 'NumberMatch',
      mode: 'numeral-to-group',
      inputMethod: 'drag',
      range: { min: 1, max: 12 },
      tileBankMode: 'distractors',
      distractorCount: 2,
      rounds: [{ value: 3 }],
      totalRounds: 1,
    },
    simpleEdit: { inputMethod: 'type' },
  },
])(
  'InstructionsOverlay play prompt ($gameId)',
  ({ gameId, initialConfig, simpleEdit }) => {
    it('clean play (no edits) skips prompt and starts immediately', async () => {
      const user = userEvent.setup();
      const onStart = vi.fn();
      const onPersistLastSession = vi.fn();
      render(
        <InstructionsOverlay
          {...baseProps({
            gameId,
            config: initialConfig,
            customGameId: 'cg1',
            customGameName: 'Custom A',
            onStart,
            onPersistLastSession,
            onUpdateCustomGame: vi.fn(async () => {}),
          })}
        />,
        { wrapper },
      );
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      expect(onStart).toHaveBeenCalled();
      expect(onPersistLastSession).toHaveBeenCalledWith(initialConfig);
    });

    it('dirty + custom-game: prompt shows Update / Save as new / Play without saving', async () => {
      const user = userEvent.setup();
      const Harness = (): JSX.Element => {
        const [config, setConfig] =
          useState<Record<string, unknown>>(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              customGameId: 'cg1',
              customGameName: 'Custom A',
              onConfigChange: setConfig,
              onUpdateCustomGame: vi.fn(async () => {}),
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      expect(
        screen.getByRole('button', { name: /update "custom a"/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /save as new/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /play without saving/i }),
      ).toBeInTheDocument();
    });

    it('dirty + custom-game: Update commits and starts', async () => {
      const user = userEvent.setup();
      const onUpdateCustomGame = vi.fn(async () => {});
      const onPersistLastSession = vi.fn();
      const onStart = vi.fn();
      const Harness = (): JSX.Element => {
        const [config, setConfig] =
          useState<Record<string, unknown>>(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              customGameId: 'cg1',
              customGameName: 'Custom A',
              onConfigChange: setConfig,
              onUpdateCustomGame,
              onPersistLastSession,
              onStart,
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      await user.click(
        screen.getByRole('button', { name: /update "custom a"/i }),
      );
      expect(onUpdateCustomGame).toHaveBeenCalled();
      expect(onPersistLastSession).toHaveBeenCalled();
      expect(onStart).toHaveBeenCalled();
    });

    it('dirty + custom-game: Play without saving persists last-session and starts; no update', async () => {
      const user = userEvent.setup();
      const onUpdateCustomGame = vi.fn(async () => {});
      const onPersistLastSession = vi.fn();
      const onStart = vi.fn();
      const Harness = (): JSX.Element => {
        const [config, setConfig] =
          useState<Record<string, unknown>>(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              customGameId: 'cg1',
              customGameName: 'Custom A',
              onConfigChange: setConfig,
              onUpdateCustomGame,
              onPersistLastSession,
              onStart,
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      await user.click(
        screen.getByRole('button', { name: /play without saving/i }),
      );
      expect(onUpdateCustomGame).not.toHaveBeenCalled();
      expect(onPersistLastSession).toHaveBeenCalled();
      expect(onStart).toHaveBeenCalled();
    });

    it('dirty + default game: existing 2-action prompt fires', async () => {
      const user = userEvent.setup();
      const Harness = (): JSX.Element => {
        const [config, setConfig] =
          useState<Record<string, unknown>>(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              onConfigChange: setConfig,
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      expect(
        screen.getByRole('button', { name: /save & play/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /play without saving/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /update/i }),
      ).toBeNull();
    });

    it('dirty + custom-game without onUpdateCustomGame: save-on-play dialog fires (no custom prompt)', async () => {
      const user = userEvent.setup();
      const Harness = (): JSX.Element => {
        const [config, setConfig] =
          useState<Record<string, unknown>>(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              customGameId: 'cg1',
              customGameName: 'Custom A',
              onConfigChange: setConfig,
              // no onUpdateCustomGame
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      expect(
        screen.getByRole('button', { name: /save & play/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /update "custom a"/i }),
      ).toBeNull();
    });

    it('dirty + custom-game: Update error shows banner and does not start', async () => {
      const user = userEvent.setup();
      const onUpdateCustomGame = vi
        .fn()
        .mockRejectedValue(new Error('boom'));
      const onStart = vi.fn();
      const Harness = (): JSX.Element => {
        const [config, setConfig] =
          useState<Record<string, unknown>>(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              customGameId: 'cg1',
              customGameName: 'Custom A',
              onConfigChange: setConfig,
              onUpdateCustomGame,
              onStart,
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      await user.click(
        screen.getByRole('button', { name: /update "custom a"/i }),
      );
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(onStart).not.toHaveBeenCalled();
    });
  },
);
