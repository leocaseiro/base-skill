import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameCard } from './GameCard';

describe('GameCard', () => {
  it('renders a default card with chips, cog, Play, and the default type badge', () => {
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
    // Default type indicator: CircleDashed icon
    expect(
      document.querySelector('[data-card-type="default"]'),
    ).not.toBeNull();
  });

  it('renders a custom-game variant with the custom type badge and the saved name as heading', () => {
    render(
      <GameCard
        variant="customGame"
        gameId="sort-numbers"
        title="Count in Order"
        customGameName="Skip by 2"
        customGameColor="amber"
        chips={['🚀 Up', '5 numbers', '2s']}
        onPlay={vi.fn()}
        onOpenCog={vi.fn()}
      />,
    );
    expect(screen.getByText('Skip by 2')).toBeInTheDocument();
    expect(screen.getByText('Count in Order')).toBeInTheDocument();
    expect(
      document.querySelector('[data-card-type="customGame"]'),
    ).not.toBeNull();
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

  it('does not render the Star button when onToggleBookmark is omitted', () => {
    render(
      <GameCard
        variant="default"
        gameId="sort-numbers"
        title="Count in Order"
        chips={[]}
        onPlay={vi.fn()}
        onOpenCog={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /bookmark/i }),
    ).toBeNull();
  });

  it('renders an outline Star (aria-pressed=false) when isBookmarked is false', () => {
    render(
      <GameCard
        variant="default"
        gameId="sort-numbers"
        title="Count in Order"
        chips={[]}
        onPlay={vi.fn()}
        onOpenCog={vi.fn()}
        isBookmarked={false}
        onToggleBookmark={vi.fn()}
      />,
    );
    const star = screen.getByRole('button', { name: /bookmark/i });
    expect(star).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders a filled Star (aria-pressed=true) when isBookmarked is true', () => {
    render(
      <GameCard
        variant="default"
        gameId="sort-numbers"
        title="Count in Order"
        chips={[]}
        onPlay={vi.fn()}
        onOpenCog={vi.fn()}
        isBookmarked
        onToggleBookmark={vi.fn()}
      />,
    );
    const star = screen.getByRole('button', { name: /bookmark/i });
    expect(star).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking the Star fires onToggleBookmark and does NOT fire onPlay', async () => {
    const user = userEvent.setup();
    const onPlay = vi.fn();
    const onToggleBookmark = vi.fn();
    render(
      <GameCard
        variant="default"
        gameId="sort-numbers"
        title="Count in Order"
        chips={[]}
        onPlay={onPlay}
        onOpenCog={vi.fn()}
        isBookmarked={false}
        onToggleBookmark={onToggleBookmark}
      />,
    );
    await user.click(screen.getByRole('button', { name: /bookmark/i }));
    expect(onToggleBookmark).toHaveBeenCalledTimes(1);
    expect(onPlay).not.toHaveBeenCalled();
  });
});
