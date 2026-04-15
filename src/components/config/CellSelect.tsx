import type { JSX } from 'react';

export type CellSelectOption = {
  value: string;
  label: string;
};

type CellSelectProps = {
  label: string;
  value: string;
  options: CellSelectOption[];
  onChange: (value: string) => void;
  hint?: string;
};

export const CellSelect = ({
  label,
  value,
  options,
  onChange,
  hint,
}: CellSelectProps): JSX.Element => {
  const currentLabel =
    options.find((o) => o.value === value)?.label ?? value;

  return (
    <label className="relative flex h-14 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-transparent bg-muted px-3 text-center">
      <span className="text-base font-bold">{currentLabel}</span>
      {hint && (
        <span className="text-xs italic text-muted-foreground">
          {hint}
        </span>
      )}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {/* Use label attribute instead of text content so getByText only matches the visible span */}
        {options.map((o) => (
          <option key={o.value} value={o.value} label={o.label} />
        ))}
      </select>
    </label>
  );
};
