import { useEffect, useRef } from 'react';
import {
  defaultSelection,
  toggleLevel,
  toggleUnit,
  triStateForLevel,
} from '../level-unit-selection';
import type { LevelGraphemeUnit } from '@/data/words';
import type { JSX } from 'react';
import { ChipStrip } from '@/components/config/ChipStrip';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

export type LibrarySourceVariant = 'chips' | 'checkbox-tree';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  variant?: LibrarySourceVariant;
};

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const readSelected = (
  config: Record<string, unknown>,
): LevelGraphemeUnit[] => {
  const raw = config.selectedUnits;
  return Array.isArray(raw)
    ? (raw as LevelGraphemeUnit[])
    : defaultSelection();
};

const chipsForLevel = (
  level: number,
): { value: string; label: string; units: LevelGraphemeUnit[] }[] => {
  const byPhoneme = new Map<string, LevelGraphemeUnit[]>();
  for (const u of GRAPHEMES_BY_LEVEL[level] ?? []) {
    const existing = byPhoneme.get(u.p);
    if (existing) existing.push(u);
    else byPhoneme.set(u.p, [u]);
  }
  return [...byPhoneme.entries()].map(([p, units]) => ({
    value: `${level}|${p}`,
    label: `${units.map((u) => u.g).join(', ')} /${p}/`,
    units,
  }));
};

const LevelRowChips = ({
  level,
  selected,
  onChange,
}: {
  level: number;
  selected: LevelGraphemeUnit[];
  onChange: (next: LevelGraphemeUnit[]) => void;
}): JSX.Element => {
  const tri = triStateForLevel(level, selected);
  const cbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (cbRef.current)
      cbRef.current.indeterminate = tri === 'indeterminate';
  }, [tri]);

  const chips = chipsForLevel(level);
  const isUnitOn = (u: LevelGraphemeUnit): boolean =>
    selected.some((s) => s.g === u.g && s.p === u.p);
  const selectedChipValues = chips
    .filter((c) => c.units.every((u) => isUnitOn(u)))
    .map((c) => c.value);

  const handleRow = () => {
    onChange(
      toggleLevel(
        level,
        selected,
        tri === 'checked' ? 'unchecked' : 'checked',
      ),
    );
  };

  const handleChip = (next: string[]) => {
    let acc = selected;
    for (const c of chips) {
      const wantOn = next.includes(c.value);
      const isOn = c.units.every((u) => isUnitOn(u));
      if (wantOn !== isOn) {
        for (const u of c.units) acc = toggleUnit(u, acc);
      }
    }
    onChange(acc);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          ref={cbRef}
          type="checkbox"
          checked={tri === 'checked'}
          onChange={handleRow}
          aria-label={`Level ${level}`}
        />
        Level {level}
      </label>
      <ChipStrip
        chips={chips.map(({ value, label }) => ({ value, label }))}
        selected={selectedChipValues}
        mode="toggleable"
        onChange={handleChip}
      />
    </div>
  );
};

const LevelRowCheckboxTree = ({
  level,
  selected,
  onChange,
}: {
  level: number;
  selected: LevelGraphemeUnit[];
  onChange: (next: LevelGraphemeUnit[]) => void;
}): JSX.Element => {
  const tri = triStateForLevel(level, selected);
  const cbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (cbRef.current)
      cbRef.current.indeterminate = tri === 'indeterminate';
  }, [tri]);

  const chips = chipsForLevel(level);
  const isUnitOn = (u: LevelGraphemeUnit): boolean =>
    selected.some((s) => s.g === u.g && s.p === u.p);

  const handleRow = () => {
    onChange(
      toggleLevel(
        level,
        selected,
        tri === 'checked' ? 'unchecked' : 'checked',
      ),
    );
  };

  const handleChip = (units: LevelGraphemeUnit[]) => {
    let acc = selected;
    for (const u of units) acc = toggleUnit(u, acc);
    onChange(acc);
  };

  return (
    <li>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          ref={cbRef}
          type="checkbox"
          checked={tri === 'checked'}
          onChange={handleRow}
          aria-label={`Level ${level}`}
        />
        Level {level}
      </label>
      <ul className="ml-6 mt-1 flex flex-col gap-1">
        {chips.map((c) => (
          <li key={c.value}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={c.units.every((u) => isUnitOn(u))}
                onChange={() => handleChip(c.units)}
                aria-label={c.label}
              />
              {c.label}
            </label>
          </li>
        ))}
      </ul>
    </li>
  );
};

export const WordSpellLibrarySource = ({
  config,
  onChange,
  variant = 'chips',
}: Props): JSX.Element => {
  const selected = readSelected(config);
  const invalid = selected.length === 0;

  const setSelected = (next: LevelGraphemeUnit[]) => {
    onChange({ ...config, selectedUnits: next });
  };

  if (variant === 'checkbox-tree') {
    return (
      <div data-invalid={invalid ? 'true' : 'false'}>
        <ul className="flex flex-col gap-2">
          {LEVELS.map((n) => (
            <LevelRowCheckboxTree
              key={n}
              level={n}
              selected={selected}
              onChange={setSelected}
            />
          ))}
        </ul>
        {invalid && (
          <p className="mt-2 text-xs text-destructive">
            Pick at least one sound to play.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4"
      data-invalid={invalid ? 'true' : 'false'}
    >
      {LEVELS.map((n) => (
        <LevelRowChips
          key={n}
          level={n}
          selected={selected}
          onChange={setSelected}
        />
      ))}
      {invalid && (
        <p className="mt-2 text-xs text-destructive">
          Pick at least one sound to play.
        </p>
      )}
    </div>
  );
};
