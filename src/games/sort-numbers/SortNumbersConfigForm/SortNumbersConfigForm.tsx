import {
  advancedToSimple,
  resolveSimpleConfig,
} from '../resolve-simple-config';
import { sortNumbersConfigFields } from '../types';
import type { SortNumbersConfig } from '../types';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';

type SortNumbersConfigFormProps = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const SortNumbersConfigForm = ({
  config,
  onChange,
}: SortNumbersConfigFormProps): JSX.Element => {
  const isSimple = config.configMode === 'simple';

  const handleModeToggle = (mode: string) => {
    if (mode === 'simple') {
      const simple = advancedToSimple(
        config as unknown as SortNumbersConfig,
      );
      const resolved = resolveSimpleConfig(simple);
      onChange(resolved as unknown as Record<string, unknown>);
    } else {
      onChange({ ...config, configMode: 'advanced' });
    }
  };

  const modeSelect = (
    <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
      Config mode
      <select
        aria-label="Config mode"
        value={isSimple ? 'simple' : 'advanced'}
        onChange={(e) => handleModeToggle(e.target.value)}
        className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="simple">simple</option>
        <option value="advanced">advanced</option>
      </select>
    </label>
  );

  if (isSimple) {
    const skip = config.skip as
      | { step?: number; start?: number }
      | undefined;
    const start = typeof skip?.start === 'number' ? skip.start : 2;
    const step = typeof skip?.step === 'number' ? skip.step : 2;
    const quantity =
      typeof config.quantity === 'number' ? config.quantity : 5;
    const direction =
      typeof config.direction === 'string'
        ? config.direction
        : 'ascending';
    const distractors = config.tileBankMode === 'distractors';

    const sequence = Array.from(
      { length: quantity },
      (_, i) => start + i * step,
    );

    return (
      <div className="flex flex-col gap-3">
        {modeSelect}

        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          Direction
          <select
            aria-label="Direction"
            value={direction}
            onChange={(e) =>
              onChange({ ...config, direction: e.target.value })
            }
            className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="ascending">ascending</option>
            <option value="descending">descending</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          Start
          <input
            type="number"
            aria-label="Start"
            value={start}
            min={1}
            onChange={(e) =>
              onChange({
                ...config,
                skip: {
                  ...(config.skip as Record<string, unknown>),
                  start: Number(e.target.value),
                },
              })
            }
            className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          Skip by
          <input
            type="number"
            aria-label="Skip by"
            value={step}
            min={2}
            max={100}
            onChange={(e) =>
              onChange({
                ...config,
                skip: {
                  ...(config.skip as Record<string, unknown>),
                  step: Number(e.target.value),
                },
              })
            }
            className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          Quantity
          <input
            type="number"
            aria-label="Quantity"
            value={quantity}
            min={2}
            max={8}
            onChange={(e) =>
              onChange({ ...config, quantity: Number(e.target.value) })
            }
            className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex min-h-12 cursor-pointer items-center gap-3 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            aria-label="Distractors"
            checked={distractors}
            onChange={(e) =>
              onChange({
                ...config,
                tileBankMode: e.target.checked
                  ? 'distractors'
                  : 'exact',
                ...(e.target.checked
                  ? {
                      distractors: {
                        source: 'gaps-only',
                        count: 'all',
                      },
                    }
                  : {}),
              })
            }
            className="h-5 w-5 accent-primary"
          />
          Distractors
        </label>

        <p className="text-sm text-muted-foreground">
          Sequence: {sequence.join(', ')}
        </p>
      </div>
    );
  }

  // Advanced mode
  return (
    <div className="flex flex-col gap-3">
      {modeSelect}
      <ConfigFormFields
        fields={sortNumbersConfigFields}
        config={config}
        onChange={onChange}
      />
    </div>
  );
};
