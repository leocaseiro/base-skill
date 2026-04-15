import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedConfigModal } from './AdvancedConfigModal';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('AdvancedConfigModal', () => {
  it('shows "Update" and "Save as new" buttons when editing a bookmark', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{
          kind: 'bookmark',
          configId: 'abc',
          name: 'Skip by 2',
          color: 'amber',
          cover: undefined,
        }}
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
      screen.getByText(/please enter a bookmark name/i),
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
        existingBookmarkNames={['Skip by 2']}
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
      screen.getByText(/bookmark with that name already exists/i),
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
        mode={{
          kind: 'bookmark',
          configId: 'abc',
          name: 'Skip by 2',
          color: 'amber',
          cover: undefined,
        }}
        config={{ direction: 'ascending' }}
        existingBookmarkNames={['Skip by 2', 'Other']}
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

  it('calls onUpdate with the latest config and name', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{
          kind: 'bookmark',
          configId: 'abc',
          name: 'Skip by 2',
          color: 'amber',
          cover: undefined,
        }}
        config={{ direction: 'ascending' }}
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
        name: 'Skip by 2',
        configId: 'abc',
      }),
    );
  });
});
