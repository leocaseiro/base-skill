import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SortNumbersConfigForm } from './SortNumbersConfigForm';

const simpleConfig: Record<string, unknown> = {
  configMode: 'simple',
  direction: 'ascending',
  quantity: 5,
  skip: { mode: 'by', step: 2, start: 2 },
  tileBankMode: 'exact',
  range: { min: 2, max: 10 },
  distractors: { source: 'random', count: 2 },
};

const advancedConfig: Record<string, unknown> = {
  configMode: 'advanced',
  direction: 'ascending',
  quantity: 6,
  skip: { mode: 'random' },
  tileBankMode: 'exact',
  range: { min: 11, max: 99 },
  distractors: { source: 'random', count: 2 },
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  totalRounds: 8,
  ttsEnabled: true,
};

describe('SortNumbersConfigForm', () => {
  describe('simple mode', () => {
    it('renders simple mode fields and preview', () => {
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={vi.fn()}
        />,
      );
      expect(
        screen.getByRole('combobox', { name: 'Config mode' }),
      ).toHaveValue('simple');
      expect(
        screen.getByRole('combobox', { name: 'Direction' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('spinbutton', { name: 'Start' }),
      ).toHaveValue(2);
      expect(
        screen.getByRole('spinbutton', { name: 'Skip by' }),
      ).toHaveValue(2);
      expect(
        screen.getByRole('spinbutton', { name: 'Quantity' }),
      ).toHaveValue(5);
      expect(
        screen.getByRole('checkbox', { name: 'Distractors' }),
      ).not.toBeChecked();
    });

    it('shows live sequence preview', () => {
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={vi.fn()}
        />,
      );
      expect(
        screen.getByText('Sequence: 2, 4, 6, 8, 10'),
      ).toBeInTheDocument();
    });

    it('calls onChange with updated skip.start when Start changes', async () => {
      const onChange = vi.fn();
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={onChange}
        />,
      );
      const input = screen.getByRole('spinbutton', { name: 'Start' });
      // Typing '5' appends to existing '2' → '25' in controlled input
      await userEvent.type(input, '5');
      const lastCall = onChange.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect((lastCall.skip as Record<string, unknown>).start).toBe(25);
    });

    it('calls onChange with updated tileBankMode when Distractors toggled', async () => {
      const onChange = vi.fn();
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={onChange}
        />,
      );
      await userEvent.click(
        screen.getByRole('checkbox', { name: 'Distractors' }),
      );
      const lastCall = onChange.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect(lastCall.tileBankMode).toBe('distractors');
    });
  });

  describe('advanced mode', () => {
    it('renders advanced mode with ConfigFormFields', () => {
      render(
        <SortNumbersConfigForm
          config={advancedConfig}
          onChange={vi.fn()}
        />,
      );
      expect(
        screen.getByRole('combobox', { name: 'Config mode' }),
      ).toHaveValue('advanced');
      // Advanced mode renders the generic fields — check for one that
      // only appears in advanced mode
      expect(
        screen.getByRole('combobox', { name: 'Input method' }),
      ).toBeInTheDocument();
    });
  });

  describe('mode toggle', () => {
    it('switches from simple to advanced', async () => {
      const onChange = vi.fn();
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={onChange}
        />,
      );
      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Config mode' }),
        'advanced',
      );
      const lastCall = onChange.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect(lastCall.configMode).toBe('advanced');
    });

    it('switches from advanced to simple', async () => {
      const onChange = vi.fn();
      render(
        <SortNumbersConfigForm
          config={advancedConfig}
          onChange={onChange}
        />,
      );
      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Config mode' }),
        'simple',
      );
      const lastCall = onChange.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect(lastCall.configMode).toBe('simple');
    });
  });
});
