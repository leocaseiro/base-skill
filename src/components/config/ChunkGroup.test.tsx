import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ChunkGroup } from './ChunkGroup';

const OPTIONS = [
  { value: 'a', emoji: '🚀', label: 'Going Up', subtitle: 'ascending' },
  {
    value: 'b',
    emoji: '🛝',
    label: 'Going Down',
    subtitle: 'descending',
  },
];

describe('ChunkGroup', () => {
  it('shows all options with their emoji and label', () => {
    render(
      <ChunkGroup
        label="Direction"
        options={OPTIONS}
        value="a"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Going Up')).toBeInTheDocument();
    expect(screen.getByText('Going Down')).toBeInTheDocument();
  });

  it('marks the selected option with aria-pressed=true', () => {
    render(
      <ChunkGroup
        label="Direction"
        options={OPTIONS}
        value="a"
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /going up/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /going down/i }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange when a different option is tapped', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [value, setValue] = useState('a');
      return (
        <ChunkGroup
          label="Direction"
          options={OPTIONS}
          value={value}
          onChange={setValue}
        />
      );
    };
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: /going down/i }),
    );
    expect(
      screen.getByRole('button', { name: /going down/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
