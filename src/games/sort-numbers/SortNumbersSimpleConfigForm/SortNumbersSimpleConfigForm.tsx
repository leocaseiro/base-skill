import type { JSX } from 'react';
import { ChunkGroup } from '@/components/config/ChunkGroup';
import { Stepper } from '@/components/config/Stepper';
import { directionLabel } from '@/games/simple-labels';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const SortNumbersSimpleConfigForm = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const direction =
    config.direction === 'descending' ? 'descending' : 'ascending';
  const quantity =
    typeof config.quantity === 'number' ? config.quantity : 5;
  const rawSkip = config.skip as
    | { mode: 'by'; step: number; start: number }
    | undefined;
  const skip: { mode: 'by'; step: number; start: number } = rawSkip ?? {
    mode: 'by',
    step: 2,
    start: 2,
  };
  const step = skip.step;
  const start = skip.start;
  const inputMethod =
    config.inputMethod === 'type'
      ? 'type'
      : config.inputMethod === 'both'
        ? 'both'
        : 'drag';

  const sequence = Array.from(
    { length: quantity },
    (_, i) => start + i * step,
  );
  const preview =
    direction === 'ascending'
      ? sequence.join(', ')
      : sequence.toReversed().join(', ');

  const ascSub = directionLabel('ascending');
  const descSub = directionLabel('descending');

  return (
    <div className="flex flex-col gap-4">
      <ChunkGroup
        label="Which way?"
        options={[
          {
            value: 'ascending',
            emoji: ascSub.emoji,
            label: ascSub.label,
            subtitle: ascSub.subtitle,
          },
          {
            value: 'descending',
            emoji: descSub.emoji,
            label: descSub.label,
            subtitle: descSub.subtitle,
          },
        ]}
        value={direction}
        onChange={(d) => onChange({ ...config, direction: d })}
      />

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
          How many?
          <Stepper
            label="How many"
            value={quantity}
            min={2}
            max={8}
            onChange={(v) => onChange({ ...config, quantity: v })}
          />
        </div>
        <div className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
          Start at
          <Stepper
            label="Start"
            value={start}
            min={1}
            max={99}
            onChange={(v) =>
              onChange({
                ...config,
                skip: { ...skip, start: v },
              })
            }
          />
        </div>
        <div className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
          Skip by
          <Stepper
            label="Skip"
            value={step}
            min={1}
            max={10}
            onChange={(v) =>
              onChange({ ...config, skip: { ...skip, step: v } })
            }
          />
        </div>
      </div>

      <div className="rounded-lg bg-muted px-3 py-2 text-center font-mono text-sm">
        {preview}
      </div>

      <ChunkGroup
        label="How do you answer?"
        options={[
          { value: 'drag', emoji: '✋', label: 'Drag' },
          { value: 'type', emoji: '⌨️', label: 'Type' },
          { value: 'both', emoji: '✨', label: 'Both' },
        ]}
        value={inputMethod}
        onChange={(m) => onChange({ ...config, inputMethod: m })}
      />
    </div>
  );
};
