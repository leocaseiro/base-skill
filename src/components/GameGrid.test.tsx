import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { GameGrid } from './GameGrid';
import type { GameCatalogEntry } from '@/games/registry';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const makeEntries = (count: number): GameCatalogEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `game-${i}`,
    titleKey: `game-${i}`,
    levels: ['1'] as const,
    subject: 'math' as const,
  }));

describe('GameGrid', () => {
  it('renders a card for each entry', () => {
    const entries = makeEntries(3);
    render(
      <GameGrid
        entries={entries}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getAllByRole('button', { name: /^play$/i }),
    ).toHaveLength(3);
  });

  it('shows "Previous" and "Next" buttons when totalPages > 1', () => {
    render(
      <GameGrid
        entries={makeEntries(1)}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
        page={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /previous/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /next/i }),
    ).toBeInTheDocument();
  });

  it('calls onPageChange(page - 1) when Previous is clicked', async () => {
    const onPageChange = vi.fn();
    render(
      <GameGrid
        entries={makeEntries(1)}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
        page={2}
        totalPages={3}
        onPageChange={onPageChange}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /previous/i }),
    );
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Previous on page 1 and Next on last page', () => {
    render(
      <GameGrid
        entries={makeEntries(1)}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /previous/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /next/i }),
    ).toBeDisabled();
  });

  it('renders empty state message when entries is empty', () => {
    render(
      <GameGrid
        entries={[]}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText(/no games found/i)).toBeInTheDocument();
  });
});
