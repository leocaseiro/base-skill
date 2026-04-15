import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameCover } from './GameCover';

describe('GameCover', () => {
  it('renders an emoji cover', () => {
    render(
      <GameCover cover={{ kind: 'emoji', emoji: '🦁' }} size="card" />,
    );
    expect(screen.getByText('🦁')).toBeInTheDocument();
  });

  it('renders an image cover with alt text', () => {
    render(
      <GameCover
        cover={{ kind: 'image', src: '/cat.png', alt: 'A cat' }}
        size="hero"
      />,
    );
    const img = screen.getByAltText('A cat');
    expect(img).toHaveAttribute('src', '/cat.png');
  });

  it('applies the gradient when provided on an emoji cover', () => {
    const { container } = render(
      <GameCover
        cover={{
          kind: 'emoji',
          emoji: '🔤',
          gradient: ['#fde68a', '#fb923c'],
        }}
        size="card"
      />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.background).toContain('linear-gradient');
  });
});
