import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SlotRow } from './SlotRow';

describe('SlotRow', () => {
  it('renders an ordered list with children', () => {
    render(
      <SlotRow>
        <li>Slot 1</li>
        <li>Slot 2</li>
      </SlotRow>,
    );
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('applies className', () => {
    render(
      <SlotRow className="gap-4">
        <li>Slot</li>
      </SlotRow>,
    );
    const list = screen.getByRole('list');
    expect(list.className).toContain('gap-4');
  });
});
