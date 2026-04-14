import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('applies touch-manipulation to prevent iOS double-tap-to-zoom delay', () => {
    render(<Button>Tap me</Button>);
    expect(screen.getByRole('button')).toHaveClass(
      'touch-manipulation',
    );
  });
});
