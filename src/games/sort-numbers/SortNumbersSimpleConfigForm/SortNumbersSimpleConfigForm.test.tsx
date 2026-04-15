import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SortNumbersSimpleConfigForm } from './SortNumbersSimpleConfigForm';

const Harness = () => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    direction: 'ascending',
    quantity: 5,
    skip: { mode: 'by', step: 2, start: 2 },
    range: { min: 2, max: 10 },
    inputMethod: 'drag',
  });
  return (
    <SortNumbersSimpleConfigForm config={config} onChange={setConfig} />
  );
};

describe('SortNumbersSimpleConfigForm', () => {
  it('flips direction via ChunkGroup', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole('button', { name: /going down/i }),
    );
    expect(
      screen.getByRole('button', { name: /going down/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a live preview of the sequence', async () => {
    render(<Harness />);
    expect(screen.getByText(/2, 4, 6, 8, 10/)).toBeInTheDocument();
  });

  it('increments quantity via stepper', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const group = screen.getByRole('group', { name: /how many/i });
    await user.click(
      within(group).getByRole('button', { name: /increase/i }),
    );
    expect(screen.getByText(/2, 4, 6, 8, 10, 12/)).toBeInTheDocument();
  });
});
