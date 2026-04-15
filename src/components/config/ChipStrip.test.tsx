import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ChipStrip } from './ChipStrip';

const CHIPS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
];

describe('ChipStrip', () => {
  it('renders chips in read-only mode without buttons', () => {
    render(
      <ChipStrip chips={CHIPS} selected={['a']} mode="read-only" />,
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('toggles chips in toggleable mode', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [selected, setSelected] = useState<string[]>(['a']);
      return (
        <ChipStrip
          chips={CHIPS}
          selected={selected}
          mode="toggleable"
          onChange={setSelected}
        />
      );
    };
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /B/i }));
    expect(screen.getByRole('button', { name: /B/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('deselects a chip that is currently selected', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [selected, setSelected] = useState<string[]>(['a']);
      return (
        <ChipStrip
          chips={CHIPS}
          selected={selected}
          mode="toggleable"
          onChange={setSelected}
        />
      );
    };
    render(<Harness />);
    expect(screen.getByRole('button', { name: /A/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: /A/i }));
    expect(screen.getByRole('button', { name: /A/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
