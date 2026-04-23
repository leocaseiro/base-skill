import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthoringPanel } from './AuthoringPanel';

vi.mock('./engine', () => ({
  generateBreakdown: vi.fn(async (word: string) => ({
    word,
    ipa: word === 'putting' ? 'pʊtɪŋ' : '',
    syllables: word === 'putting' ? ['put', 'ting'] : [],
    phonemes: word === 'putting' ? ['p', 'ʊ', 't', 'ɪ', 'ŋ'] : [],
    ritaKnown: word === 'putting',
  })),
}));

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

describe('AuthoringPanel word field', () => {
  it('pre-fills the word field from initialWord', () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    expect(screen.getByRole('textbox', { name: /word/i })).toHaveValue(
      'putting',
    );
  });

  it('shows the dictionary.com banner for an unknown word', async () => {
    render(<AuthoringPanel open onClose={noop} initialWord="" />);
    await userEvent.type(
      screen.getByRole('textbox', { name: /word/i }),
      'xyzzy',
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(
      screen.getByRole('link', { name: /open in dictionary\.com/i }),
    ).toHaveAttribute(
      'href',
      'https://www.dictionary.com/browse/xyzzy',
    );
  });
});
