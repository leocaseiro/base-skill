import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { CellSelect } from './CellSelect';

const OPTIONS = [
  { value: '1', label: 'One' },
  { value: '2', label: 'Two' },
];

describe('CellSelect', () => {
  it('shows the current label as preview', () => {
    render(
      <CellSelect
        label="Count"
        value="1"
        options={OPTIONS}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('One')).toBeInTheDocument();
  });

  it('fires onChange when the underlying select changes', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [value, setValue] = useState('1');
      return (
        <CellSelect
          label="Count"
          value={value}
          options={OPTIONS}
          onChange={setValue}
        />
      );
    };
    render(<Harness />);
    await user.selectOptions(screen.getByLabelText('Count'), '2');
    expect(screen.getByText('Two')).toBeInTheDocument();
  });
});
