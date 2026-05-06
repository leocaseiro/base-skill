import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedConfigModal } from './AdvancedConfigModal';
import type { Draft } from '@/components/answer-game/InstructionsOverlay/useConfigDraft';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const customGameMode = {
  kind: 'customGame' as const,
  configId: 'abc',
};

const draftFor = (overrides: Partial<Draft> = {}): Draft => ({
  config: {},
  name: 'Skip by 2',
  color: 'amber',
  cover: undefined,
  ...overrides,
});

describe('AdvancedConfigModal', () => {
  it('shows "Update" and "Save as new" buttons when editing a custom game', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor({ config: { direction: 'ascending' } })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onUpdate={vi.fn()}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /update "skip by 2"/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save as new/i }),
    ).toBeInTheDocument();
  });

  it('shows only "Save as new" when editing a default card', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.queryByRole('button', { name: /update/i }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /save as new/i }),
    ).toBeInTheDocument();
  });

  it('does not save with an empty name — focuses the input and surfaces the error', async () => {
    const user = userEvent.setup();
    const onSaveNew = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={onSaveNew}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(onSaveNew).not.toHaveBeenCalled();
    expect(
      screen.getByText(/please enter a custom game name/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/skip by 2/i)).toHaveFocus();
  });

  it('does not save with a duplicate name — focuses the input and surfaces the error', async () => {
    const user = userEvent.setup();
    const onSaveNew = vi.fn();
    const onChange = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: 'Skip by 2' })}
        onChange={onChange}
        existingCustomGameNames={['Skip by 2']}
        onCancel={() => {}}
        onSaveNew={onSaveNew}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(onSaveNew).not.toHaveBeenCalled();
    expect(
      screen.getByText(/custom game with that name already exists/i),
    ).toBeInTheDocument();
  });

  it('allows "Update" to keep the same name without flagging a duplicate', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor({ config: { direction: 'ascending' } })}
        onChange={vi.fn()}
        existingCustomGameNames={['Skip by 2', 'Other']}
        onCancel={() => {}}
        onUpdate={onUpdate}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /update "skip by 2"/i }),
    );
    expect(onUpdate).toHaveBeenCalled();
  });

  it('does NOT render a Delete button for default mode', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.queryByRole('button', { name: /^delete$/i }),
    ).toBeNull();
  });

  it('renders a Delete button for customGame mode', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor()}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /^delete$/i }),
    ).toBeInTheDocument();
  });

  it('opens a confirmation dialog when Delete is clicked; Cancel keeps the modal open and does not call onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor()}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
      { wrapper },
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(
      screen.getByText(/delete "skip by 2"\?/i),
    ).toBeInTheDocument();
    const cancels = screen.getAllByRole('button', {
      name: /^cancel$/i,
    });
    await user.click(cancels.at(-1)!);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onSaveNew with the current value on Save-as-new', async () => {
    const user = userEvent.setup();
    const onSaveNew = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({
          name: 'My Sort',
          config: {
            configMode: 'simple',
            wrongTileBehavior: 'lock-auto-eject',
          },
        })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={onSaveNew}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(onSaveNew).toHaveBeenCalledTimes(1);
    expect(onSaveNew).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Sort',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nested expect.objectContaining returns any
        config: expect.objectContaining({ configMode: 'advanced' }),
      }),
    );
  });

  it('stamps configMode: "advanced" on Update payload', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor({
          config: { direction: 'ascending', configMode: 'simple' },
        })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onUpdate={onUpdate}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /update "skip by 2"/i }),
    );
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nested expect.objectContaining returns any
        config: expect.objectContaining({ configMode: 'advanced' }),
      }),
    );
  });

  it('shows an inline error banner when errorMessage is set', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor()}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        errorMessage="Couldn't save — try again."
      />,
      { wrapper },
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't save — try again.",
    );
  });

  it('propagates field changes via onChange (config patch)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={onChange}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    await user.type(screen.getByPlaceholderText(/skip by 2/i), 'M');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'M' }),
    );
  });

  it('calls onDelete with the configId and closes the modal on Confirm', async () => {
    const user = userEvent.setup();
    // eslint-disable-next-line unicorn/no-useless-undefined -- TypeScript requires the explicit undefined argument for mockResolvedValue<void>
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={onOpenChange}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor()}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
      { wrapper },
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    const confirms = screen.getAllByRole('button', {
      name: /^delete$/i,
    });
    await user.click(confirms.at(-1)!);
    expect(onDelete).toHaveBeenCalledWith('abc');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders the level rows for word-spell games', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="word-spell"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /Level 1/ }),
    ).toBeInTheDocument();
  });

  it('does not render the Level select for non-word-spell games', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.queryByRole('button', { name: /Level/i })).toBeNull();
  });

  it('reveals distractorCount when WordSpell tileBankMode is distractors', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="word-spell"
        mode={{ kind: 'default' }}
        value={draftFor({
          name: '',
          config: { tileBankMode: 'distractors', distractorCount: 3 },
        })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByLabelText(/distractor count/i),
    ).toBeInTheDocument();
  });

  it('hides distractorCount when WordSpell tileBankMode is exact', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="word-spell"
        mode={{ kind: 'default' }}
        value={draftFor({
          name: '',
          config: { tileBankMode: 'exact' },
        })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.queryByLabelText(/distractor count/i)).toBeNull();
  });
});
