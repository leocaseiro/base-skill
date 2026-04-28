import type { JSX } from 'react';

export type Chip = {
  value: string;
  label: string;
  subtitle?: string;
};

type ChipStripProps =
  | {
      chips: Chip[];
      selected: string[];
      mode: 'read-only';
    }
  | {
      chips: Chip[];
      selected: string[];
      mode: 'toggleable';
      onChange: (next: string[]) => void;
    };

export const ChipStrip = (props: ChipStripProps): JSX.Element => {
  const { chips, selected, mode } = props;

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c) => {
        const on = selected.includes(c.value);
        const base = 'rounded-full px-2.5 py-1 text-xs font-bold';
        const cls = on
          ? `${base} bg-primary text-primary-foreground`
          : `${base} border border-border bg-muted text-foreground`;

        if (mode === 'read-only') {
          return (
            <span key={c.value} className={cls}>
              {c.label}
            </span>
          );
        }

        const toggle = () => {
          const next = on
            ? selected.filter((v) => v !== c.value)
            : [...selected, c.value];
          props.onChange(next);
        };

        return (
          <button
            key={c.value}
            type="button"
            aria-pressed={on}
            aria-label={c.label}
            onClick={toggle}
            className={cls}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
};
