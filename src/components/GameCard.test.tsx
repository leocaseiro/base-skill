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
    expect(
      document.querySelector('[data-card-type="custom"]'),
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
});
