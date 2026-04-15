import { modeToPair, pairToMode, validToValues } from '../pair-to-mode';
import type { Primitive } from '../pair-to-mode';
import type { NumberMatchMode } from '../types';
import type { JSX } from 'react';
import { CellSelect } from '@/components/config/CellSelect';
import { ChunkGroup } from '@/components/config/ChunkGroup';
import { Stepper } from '@/components/config/Stepper';

const PRIMITIVE_LABELS: Record<Primitive, string> = {
  numeral: '5',
  group: '●●●●●',
  word: 'five',
  ordinal: '5th',
};

const PRIMITIVE_OPTIONS = [
  { value: 'numeral', label: '5 (numeral)' },
  { value: 'group', label: '●●●●● (group)' },
  { value: 'word', label: 'five (word)' },
  { value: 'ordinal', label: '5th (ordinal)' },
];

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const NumberMatchSimpleConfigForm = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const mode =
    typeof config.mode === 'string'
      ? (config.mode as NumberMatchMode)
      : 'numeral-to-group';
  const { from, to } = modeToPair(mode);
  const rangeObj =
    typeof config.range === 'object' && config.range !== null
      ? (config.range as { min?: number; max?: number })
      : { min: 1, max: 10 };
  const min = typeof rangeObj.min === 'number' ? rangeObj.min : 1;
  const max = typeof rangeObj.max === 'number' ? rangeObj.max : 10;
  const inputMethod =
    config.inputMethod === 'type' || config.inputMethod === 'both'
      ? config.inputMethod
      : 'drag';
  const distractorCount =
    typeof config.distractorCount === 'number'
      ? config.distractorCount
      : 3;

  const setPair = (nextFrom: Primitive, nextTo: Primitive) => {
    const valid = validToValues(nextFrom);
    const fallback = valid[0];
    const finalTo = valid.includes(nextTo)
      ? nextTo
      : fallback === undefined
        ? nextTo
        : fallback;
    onChange({
      ...config,
      mode: pairToMode(nextFrom, finalTo),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          What you see → What you match
        </span>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <CellSelect
            label="what you see"
            value={from}
            options={PRIMITIVE_OPTIONS}
            onChange={(v) => setPair(v as Primitive, to)}
          />
          <span aria-hidden="true" className="text-xl">
            →
          </span>
          <CellSelect
            label="what you match"
            value={to}
            options={PRIMITIVE_OPTIONS.filter((o) =>
              validToValues(from).includes(o.value as Primitive),
            )}
            onChange={(v) => setPair(from, v as Primitive)}
          />
        </div>
        <p className="mt-2 text-center text-xs italic text-muted-foreground">
          {PRIMITIVE_LABELS[from]} → {PRIMITIVE_LABELS[to]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          role="group"
          aria-label="min"
          className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground"
        >
          <span>Min</span>
          <span className="sr-only">{min}</span>
          <Stepper
            label="lower limit"
            value={min}
            min={1}
            max={999}
            onChange={(v) =>
              onChange({
                ...config,
                range: { min: v, max: Math.max(v, max) },
              })
            }
          />
        </div>
        <div
          role="group"
          aria-label="max"
          className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground"
        >
          <span>Max</span>
          <span className="sr-only">{max}</span>
          <Stepper
            label="upper limit"
            value={max}
            min={1}
            max={999}
            onChange={(v) =>
              onChange({
                ...config,
                range: { min: Math.min(min, v), max: v },
              })
            }
          />
        </div>
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

      <div className="flex flex-col items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
        Extra wrong tiles
        <Stepper
          label="distractors"
          value={distractorCount}
          min={0}
          max={10}
          onChange={(v) =>
            onChange({
              ...config,
              distractorCount: v,
              tileBankMode: v > 0 ? 'distractors' : 'exact',
            })
          }
        />
      </div>
    </div>
  );
};
