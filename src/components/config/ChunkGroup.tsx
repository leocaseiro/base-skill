import type { JSX } from 'react';

export type ChunkOption = {
  value: string;
  emoji: string;
  label: string;
  subtitle?: string;
};

type ChunkGroupProps = {
  label: string;
  options: ChunkOption[];
  value: string;
  onChange: (value: string) => void;
};

export const ChunkGroup = ({
  label,
  options,
  value,
  onChange,
}: ChunkGroupProps): JSX.Element => (
  <div
    role="group"
    aria-label={label}
    className="grid gap-2"
    style={{
      gridTemplateColumns: `repeat(${options.length}, 1fr)`,
    }}
  >
    {options.map((o) => {
      const selected = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          aria-pressed={selected}
          aria-label={o.label}
          onClick={() => onChange(o.value)}
          className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center ${
            selected
              ? 'border-primary bg-primary/10'
              : 'border-transparent bg-muted'
          }`}
        >
          <span className="text-2xl" aria-hidden="true">
            {o.emoji}
          </span>
          <span className="text-sm font-bold">{o.label}</span>
          {o.subtitle && (
            <span className="text-xs italic text-foreground/80">
              {o.subtitle}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
