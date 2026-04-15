import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { NumberMatchSimpleConfigForm } from './NumberMatchSimpleConfigForm';

const Harness = () => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    mode: 'numeral-to-group',
    range: { min: 1, max: 10 },
    inputMethod: 'drag',
    distractorCount: 3,
    tileStyle: 'dots',
    tileBankMode: 'distractors',
  });
  return (
    <NumberMatchSimpleConfigForm config={config} onChange={setConfig} />
  );
};

describe('NumberMatchSimpleConfigForm', () => {
  it('resets "to" when "from" change leaves it invalid', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(
      screen.getByLabelText(/what you see/i),
      'group',
    );
    const toSelect = screen.getByLabelText(/what you match/i);
    expect(toSelect).toHaveValue('numeral');
  });

  it('clamps max below min', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const minGroup = screen.getByRole('group', { name: /min/i });
    for (let i = 0; i < 15; i++) {
      await user.click(
        within(minGroup).getByRole('button', { name: /increase/i }),
      );
    }
    expect(
      Number(
        screen
          .getByRole('group', { name: /max/i })
          .textContent.match(/\d+/)?.[0],
      ),
    ).toBeGreaterThanOrEqual(16);
  });
});
