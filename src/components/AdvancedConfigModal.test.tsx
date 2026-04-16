import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedConfigModal } from './AdvancedConfigModal';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const customGameMode = {
  kind: 'customGame' as const,
  configId: 'abc',
  name: 'Skip by 2',
  color: 'amber' as const,
  cover: undefined,
};

describe('AdvancedConfigModal', () => {
  it('shows "Update" and "Save as new" buttons when editing a custom game', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        config={{ direction: 'ascending' }}
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
        config={{}}
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
        config={{}}
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
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        config={{}}
        existingCustomGameNames={['Skip by 2']}
        onCancel={() => {}}
        onSaveNew={onSaveNew}
      />,
      { wrapper },
    );
    const input = screen.getByPlaceholderText(/skip by 2/i);
    await user.type(input, 'Skip by 2');
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(onSaveNew).not.toHaveBeenCalled();
    expect(
      screen.getByText(/custom game with that name already exists/i),
    ).toBeInTheDocument();
    expect(input).toHaveFocus();
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
        config={{ direction: 'ascending' }}
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
        config={{}}
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
        config={{}}
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
        config={{}}
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
        config={{}}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
      { wrapper },
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    // Confirmation dialog's destructive button has label "Delete"
    const confirms = screen.getAllByRole('button', {
      name: /^delete$/i,
    });
    // The second "Delete" is the confirmation button inside the nested dialog
    await user.click(confirms.at(-1)!);
    expect(onDelete).toHaveBeenCalledWith('abc');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
