import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameCard } from './GameCard';

describe('GameCard', () => {
  it('renders a default card with chips, cog, and Play', () => {
    render(
      <GameCard
        variant="default"
        gameId="sort-numbers"
        title="Count in Order"
        chips={['🚀 Up', '5 numbers', '2s']}
        onPlay={vi.fn()}
        onOpenCog={vi.fn()}
      />,
    );
    expect(screen.getByText('🚀 Up')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /play/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it('adds a bookmark name subtitle for bookmark variant', () => {
    render(
      <GameCard
        variant="bookmark"
        gameId="sort-numbers"
        title="Count in Order"
        bookmarkName="Skip by 2"
        bookmarkColor="amber"
        chips={['🚀 Up', '5 numbers', '2s']}
        onPlay={vi.fn()}
        onOpenCog={vi.fn()}
      />,
    );
    expect(screen.getByText('Skip by 2')).toBeInTheDocument();
  });

  it('fires onOpenCog when the cog is tapped', async () => {
    const user = userEvent.setup();
    const onOpenCog = vi.fn();
    render(
      <GameCard
        variant="default"
        gameId="sort-numbers"
        title="Count in Order"
        chips={[]}
        onPlay={vi.fn()}
        onOpenCog={onOpenCog}
      />,
    );
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(onOpenCog).toHaveBeenCalled();
  });
});
