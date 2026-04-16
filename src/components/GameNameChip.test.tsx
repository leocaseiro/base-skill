// src/components/GameNameChip.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameNameChip } from './GameNameChip';

describe('GameNameChip', () => {
  it('renders the game title', () => {
    render(<GameNameChip title="Word Spell" />);
    expect(screen.getByText('Word Spell')).toBeInTheDocument();
  });

  it('renders customGameName badge when provided', () => {
    render(
      <GameNameChip title="Word Spell" customGameName="Easy Mode" />,
    );
    expect(screen.getByText('Easy Mode')).toBeInTheDocument();
  });

  it('renders subject badge when no customGameName', () => {
    render(<GameNameChip title="Word Spell" subject="reading" />);
    expect(screen.getByText('reading')).toBeInTheDocument();
  });

  it('does not render subject badge when customGameName is present', () => {
    render(
      <GameNameChip
        title="Word Spell"
        customGameName="Easy Mode"
        subject="reading"
      />,
    );
    expect(screen.queryByText('reading')).not.toBeInTheDocument();
  });
});
