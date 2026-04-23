import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthoringPanel } from './AuthoringPanel';

const noop = () => {};

describe('AuthoringPanel shell', () => {
  it('renders when open', () => {
    render(<AuthoringPanel open onClose={noop} initialWord="" />);
    expect(
      screen.getByRole('dialog', { name: /make up a word/i }),
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AuthoringPanel open={false} onClose={noop} initialWord="" />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when ESC is pressed (clean form)', async () => {
    const onClose = vi.fn();
    render(<AuthoringPanel open onClose={onClose} initialWord="" />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exposes aria-modal="true" and aria-labelledby', () => {
    render(<AuthoringPanel open onClose={noop} initialWord="" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(
      document.querySelector(`#${CSS.escape(labelId!)}`),
    ).toBeInTheDocument();
  });
});
