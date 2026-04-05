// src/components/ConfigFormFields.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfigFormFields } from './ConfigFormFields';
import type { ConfigField } from '@/lib/config-fields';

const fields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'drag' },
      { value: 'type', label: 'type' },
    ],
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 10,
  },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];

const config: Record<string, unknown> = {
  inputMethod: 'drag',
  totalRounds: 5,
  ttsEnabled: true,
};

describe('ConfigFormFields', () => {
  it('renders a label and select for select fields', () => {
    render(
      <ConfigFormFields
        fields={fields}
        config={config}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Input method')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Input method' }),
    ).toHaveValue('drag');
  });

  it('renders a label and number input for number fields', () => {
    render(
      <ConfigFormFields
        fields={fields}
        config={config}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Total rounds')).toHaveValue(5);
  });

  it('renders a checkbox for checkbox fields', () => {
    render(
      <ConfigFormFields
        fields={fields}
        config={config}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('checkbox', { name: 'TTS enabled' }),
    ).toBeChecked();
  });

  it('calls onChange with updated config when select changes', async () => {
    const onChange = vi.fn();
    render(
      <ConfigFormFields
        fields={fields}
        config={config}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Input method' }),
      'type',
    );
    expect(onChange).toHaveBeenCalledWith({
      ...config,
      inputMethod: 'type',
    });
  });

  it('calls onChange with updated config when checkbox toggles', async () => {
    const onChange = vi.fn();
    render(
      <ConfigFormFields
        fields={fields}
        config={config}
        onChange={onChange}
      />,
    );
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'TTS enabled' }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...config,
      ttsEnabled: false,
    });
  });
});
