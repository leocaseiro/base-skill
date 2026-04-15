import { useEffect, useState } from 'react';
import type { JSX, KeyboardEvent } from 'react';

type StepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
};

const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

export const Stepper = ({
  value,
  min,
  max,
  onChange,
  label,
}: StepperProps): JSX.Element => {
  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    const parsed = /^-?\d+$/.test(trimmed)
      ? Number.parseInt(trimmed, 10)
      : Number.NaN;
    if (Number.isFinite(parsed)) {
      const next = clamp(parsed, min, max);
      setDraft(String(next));
      if (next !== value) onChange(next);
    } else {
      setDraft(String(value));
    }
  };

  const dec = () => onChange(clamp(value - 1, min, max));
  const inc = () => onChange(clamp(value + 1, min, max));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        inc();

        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        dec();

        break;
      }
      case 'Enter': {
        event.preventDefault();
        commit(draft);
        event.currentTarget.blur();

        break;
      }
      // No default
    }
  };

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-lg border border-input bg-background"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={dec}
        disabled={value <= min}
        className="h-10 w-10 text-lg disabled:opacity-40"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="-?[0-9]*"
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={(event) => event.target.select()}
        className="h-10 w-16 bg-transparent text-center font-bold outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={inc}
        disabled={value >= max}
        className="h-10 w-10 text-lg disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
};
