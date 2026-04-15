import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Stepper } from './Stepper';

const Harness = ({
  initial,
  min,
  max,
}: {
  initial: number;
  min: number;
  max: number;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <Stepper
      value={value}
      min={min}
      max={max}
      onChange={setValue}
      label="Count"
    />
  );
};

const getInput = (): HTMLInputElement => screen.getByRole('spinbutton');

describe('Stepper', () => {
  it('increments on + click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.click(screen.getByRole('button', { name: /increase/i }));
    expect(getInput().value).toBe('4');
  });

  it('decrements on - click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.click(screen.getByRole('button', { name: /decrease/i }));
    expect(getInput().value).toBe('2');
  });

  it('clamps at max on click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={9} min={1} max={10} />);
    await user.click(screen.getByRole('button', { name: /increase/i }));
    await user.click(screen.getByRole('button', { name: /increase/i }));
    expect(getInput().value).toBe('10');
  });

  it('clamps at min on click', async () => {
    const user = userEvent.setup();
    render(<Harness initial={2} min={1} max={10} />);
    await user.click(screen.getByRole('button', { name: /decrease/i }));
    await user.click(screen.getByRole('button', { name: /decrease/i }));
    expect(getInput().value).toBe('1');
  });

  it('increments on ArrowUp', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.click(getInput());
    await user.keyboard('{ArrowUp}');
    expect(getInput().value).toBe('4');
  });

  it('decrements on ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.click(getInput());
    await user.keyboard('{ArrowDown}');
    expect(getInput().value).toBe('2');
  });

  it('accepts typed input and commits on blur, clamped to range', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.clear(getInput());
    await user.type(getInput(), '7');
    await user.tab();
    expect(getInput().value).toBe('7');
  });

  it('clamps typed input above max on blur', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.clear(getInput());
    await user.type(getInput(), '99');
    await user.tab();
    expect(getInput().value).toBe('10');
  });

  it('reverts non-numeric input on blur', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.clear(getInput());
    await user.type(getInput(), 'abc');
    await user.tab();
    expect(getInput().value).toBe('3');
  });

  it('strips leading zeros on commit', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={10} />);
    await user.clear(getInput());
    await user.type(getInput(), '007');
    await user.tab();
    expect(getInput().value).toBe('7');
  });
});
