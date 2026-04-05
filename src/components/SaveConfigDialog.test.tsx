import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { SaveConfigDialog } from './SaveConfigDialog';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('SaveConfigDialog', () => {
  it('renders with suggested name pre-filled', () => {
    render(
      <SaveConfigDialog
        open={true}
        suggestedName="Word Spell #2"
        existingNames={[]}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );
    const input = screen.getByRole('textbox');
    expect((input as HTMLInputElement).value).toBe('Word Spell #2');
  });

  it('calls onSave with the name when form is submitted', async () => {
    const onSave = vi.fn();
    render(
      <SaveConfigDialog
        open={true}
        suggestedName="Word Spell"
        existingNames={[]}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save/i }),
    );
    expect(onSave).toHaveBeenCalledWith(
      'Word Spell',
      expect.any(String),
    );
  });

  it('shows error and does not call onSave when name is empty', async () => {
    const onSave = vi.fn();
    render(
      <SaveConfigDialog
        open={true}
        suggestedName=""
        existingNames={[]}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.click(
      screen.getByRole('button', { name: /save/i }),
    );
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows error and does not call onSave when name is a duplicate', async () => {
    const onSave = vi.fn();
    render(
      <SaveConfigDialog
        open={true}
        suggestedName="Easy Mode"
        existingNames={['Easy Mode']}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save/i }),
    );
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(
      <SaveConfigDialog
        open={true}
        suggestedName="Word Spell"
        existingNames={[]}
        onSave={vi.fn()}
        onCancel={onCancel}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /cancel/i }),
    );
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    render(
      <SaveConfigDialog
        open={false}
        suggestedName="Word Spell"
        existingNames={[]}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
