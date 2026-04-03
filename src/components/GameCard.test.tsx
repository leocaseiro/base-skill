import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { GameCard } from './GameCard';
import type { GameCatalogEntry } from '@/games/registry';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const mockEntry = {
  id: 'word-spell',
  titleKey: 'word-spell',
  levels: ['1', '2'],
  subject: 'reading',
} satisfies GameCatalogEntry;

describe('GameCard', () => {
  it('renders the game title key as text', () => {
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={false}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Word spell')).toBeInTheDocument();
  });

  it('renders level badges', () => {
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={false}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Year 1')).toBeInTheDocument();
    expect(screen.getByText('Year 2')).toBeInTheDocument();
  });

  it('calls onPlay with gameId when Play is clicked', async () => {
    const onPlay = vi.fn();
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={false}
        onBookmarkToggle={vi.fn()}
        onPlay={onPlay}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /play/i }),
    );
    expect(onPlay).toHaveBeenCalledWith('word-spell');
  });

  it('calls onBookmarkToggle with gameId when bookmark button is clicked', async () => {
    const onBookmarkToggle = vi.fn();
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={false}
        onBookmarkToggle={onBookmarkToggle}
        onPlay={vi.fn()}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /bookmark/i }),
    );
    expect(onBookmarkToggle).toHaveBeenCalledWith('word-spell');
  });

  it('shows "remove bookmark" aria-label when isBookmarked is true', () => {
    render(
      <GameCard
        entry={mockEntry}
        isBookmarked={true}
        onBookmarkToggle={vi.fn()}
        onPlay={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /remove bookmark/i }),
    ).toBeInTheDocument();
  });
});
