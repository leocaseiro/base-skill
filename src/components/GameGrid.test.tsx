import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameGrid } from './GameGrid';

describe('GameGrid', () => {
  it('renders the provided cards inside a responsive grid', () => {
    const cards = [
      <div key="a" data-testid="card-a">
        A
      </div>,
      <div key="b" data-testid="card-b">
        B
      </div>,
      <div key="c" data-testid="card-c">
        C
      </div>,
    ];
    render(<GameGrid cards={cards} />);
    expect(screen.getByTestId('card-a')).toBeInTheDocument();
    expect(screen.getByTestId('card-b')).toBeInTheDocument();
    expect(screen.getByTestId('card-c')).toBeInTheDocument();
  });

  it('renders nothing in the grid when cards is empty', () => {
    const { container } = render(<GameGrid cards={[]} />);
    const grid = container.querySelector('div');
    expect(grid).not.toBeNull();
    expect(grid?.children).toHaveLength(0);
  });
});
