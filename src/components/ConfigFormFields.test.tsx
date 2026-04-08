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

describe('nested-select fields', () => {
  it('renders a select for nested-select fields', () => {
    const nestedSelectFields: ConfigField[] = [
      {
        type: 'nested-select',
        key: 'skip',
        subKey: 'mode',
        label: 'Skip mode',
        options: [
          { value: 'random', label: 'random' },
          { value: 'consecutive', label: 'consecutive' },
          { value: 'by', label: 'by' },
        ],
      },
    ];
    render(
      <ConfigFormFields
        fields={nestedSelectFields}
        config={{ skip: { mode: 'random' } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Skip mode' }),
    ).toHaveValue('random');
  });

  it('calls onChange preserving other nested keys when nested-select changes', async () => {
    const onChange = vi.fn();
    const nestedSelectFields: ConfigField[] = [
      {
        type: 'nested-select',
        key: 'skip',
        subKey: 'mode',
        label: 'Skip mode',
        options: [
          { value: 'random', label: 'random' },
          { value: 'by', label: 'by' },
        ],
      },
    ];
    render(
      <ConfigFormFields
        fields={nestedSelectFields}
        config={{ skip: { mode: 'random', step: 3 } }}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Skip mode' }),
      'by',
    );
    expect(onChange).toHaveBeenCalledWith({
      skip: { mode: 'by', step: 3 },
    });
  });
});

describe('nested-select-or-number fields', () => {
  it('renders type selector and number input when value is numeric', () => {
    const nestedSelectOrNumberFields: ConfigField[] = [
      {
        type: 'nested-select-or-number',
        key: 'distractors',
        subKey: 'count',
        label: 'Distractor count',
        min: 1,
        max: 20,
      },
    ];
    render(
      <ConfigFormFields
        fields={nestedSelectOrNumberFields}
        config={{ distractors: { source: 'random', count: 3 } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Distractor count type' }),
    ).toHaveValue('number');
    expect(
      screen.getByRole('spinbutton', {
        name: 'Distractor count value',
      }),
    ).toHaveValue(3);
  });

  it('hides number input and shows all in type selector when value is all', () => {
    const nestedSelectOrNumberFields: ConfigField[] = [
      {
        type: 'nested-select-or-number',
        key: 'distractors',
        subKey: 'count',
        label: 'Distractor count',
        min: 1,
        max: 20,
      },
    ];
    render(
      <ConfigFormFields
        fields={nestedSelectOrNumberFields}
        config={{ distractors: { source: 'gaps-only', count: 'all' } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Distractor count type' }),
    ).toHaveValue('all');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('switches to all when type selector changes to all', async () => {
    const onChange = vi.fn();
    const nestedSelectOrNumberFields: ConfigField[] = [
      {
        type: 'nested-select-or-number',
        key: 'distractors',
        subKey: 'count',
        label: 'Distractor count',
        min: 1,
        max: 20,
      },
    ];
    render(
      <ConfigFormFields
        fields={nestedSelectOrNumberFields}
        config={{ distractors: { count: 3 } }}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Distractor count type' }),
      'all',
    );
    expect(onChange).toHaveBeenCalledWith({
      distractors: { count: 'all' },
    });
  });
});

describe('nested-select-or-number with custom options', () => {
  const customOptionsFields: ConfigField[] = [
    {
      type: 'nested-select-or-number',
      key: 'skip',
      subKey: 'start',
      label: 'Skip start',
      min: 1,
      max: 999,
      options: [
        { value: 'range-min', label: 'range-min' },
        { value: 'random', label: 'random' },
      ],
    },
  ];

  it('renders string option selected when value is a string from options', () => {
    render(
      <ConfigFormFields
        fields={customOptionsFields}
        config={{ skip: { mode: 'by', step: 2, start: 'range-min' } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Skip start type' }),
    ).toHaveValue('range-min');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('renders number option selected with input when value is a number', () => {
    render(
      <ConfigFormFields
        fields={customOptionsFields}
        config={{ skip: { mode: 'by', step: 2, start: 5 } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Skip start type' }),
    ).toHaveValue('number');
    expect(
      screen.getByRole('spinbutton', { name: 'Skip start value' }),
    ).toHaveValue(5);
  });

  it('switches to number input when selecting number option', async () => {
    const onChange = vi.fn();
    render(
      <ConfigFormFields
        fields={customOptionsFields}
        config={{ skip: { mode: 'by', step: 2, start: 'range-min' } }}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Skip start type' }),
      'number',
    );
    expect(onChange).toHaveBeenCalledWith({
      skip: { mode: 'by', step: 2, start: 1 },
    });
  });

  it('switches to string value when selecting a string option', async () => {
    const onChange = vi.fn();
    render(
      <ConfigFormFields
        fields={customOptionsFields}
        config={{ skip: { mode: 'by', step: 2, start: 5 } }}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Skip start type' }),
      'random',
    );
    expect(onChange).toHaveBeenCalledWith({
      skip: { mode: 'by', step: 2, start: 'random' },
    });
  });
});

describe('visibleWhen', () => {
  it('hides a field when nested visibleWhen condition is not met', () => {
    const visibleWhenFields: ConfigField[] = [
      {
        type: 'nested-number',
        key: 'skip',
        subKey: 'step',
        label: 'Skip step',
        min: 2,
        max: 100,
        visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
      },
    ];
    render(
      <ConfigFormFields
        fields={visibleWhenFields}
        config={{ skip: { mode: 'random', step: 3 } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByLabelText('Skip step'),
    ).not.toBeInTheDocument();
  });

  it('shows a field when nested visibleWhen condition is met', () => {
    const visibleWhenFields: ConfigField[] = [
      {
        type: 'nested-number',
        key: 'skip',
        subKey: 'step',
        label: 'Skip step',
        min: 2,
        max: 100,
        visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
      },
    ];
    render(
      <ConfigFormFields
        fields={visibleWhenFields}
        config={{ skip: { mode: 'by', step: 3 } }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Skip step')).toBeInTheDocument();
  });

  it('hides a field based on top-level key visibleWhen', () => {
    const visibleWhenFields: ConfigField[] = [
      {
        type: 'nested-select',
        key: 'distractors',
        subKey: 'source',
        label: 'Distractor source',
        options: [{ value: 'random', label: 'random' }],
        visibleWhen: { key: 'tileBankMode', value: 'distractors' },
      },
    ];
    render(
      <ConfigFormFields
        fields={visibleWhenFields}
        config={{
          tileBankMode: 'exact',
          distractors: { source: 'random' },
        }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('combobox', { name: 'Distractor source' }),
    ).not.toBeInTheDocument();
  });

  it('shows a field when top-level key visibleWhen condition is met', () => {
    const visibleWhenFields: ConfigField[] = [
      {
        type: 'nested-select',
        key: 'distractors',
        subKey: 'source',
        label: 'Distractor source',
        options: [{ value: 'random', label: 'random' }],
        visibleWhen: { key: 'tileBankMode', value: 'distractors' },
      },
    ];
    render(
      <ConfigFormFields
        fields={visibleWhenFields}
        config={{
          tileBankMode: 'distractors',
          distractors: { source: 'random' },
        }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Distractor source' }),
    ).toBeInTheDocument();
  });
});
