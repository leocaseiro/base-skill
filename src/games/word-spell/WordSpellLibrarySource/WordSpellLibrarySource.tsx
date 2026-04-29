import {
  defaultSelection,
  headerStateForLevel,
  toggleLevel,
  toggleUnit,
  unitLevel,
} from '../level-unit-selection';
import { resolveSimpleConfig } from '../resolve-simple-config';
import { WordPreviewBar } from '../WordPreviewBar/WordPreviewBar';
import type {
  LevelGraphemeUnit,
  Region,
  WordFilter,
} from '@/data/words';
import type { JSX } from 'react';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
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

const readRegion = (config: Record<string, unknown>): Region =>
  typeof config.region === 'string' ? (config.region as Region) : 'aus';

const maxLevelOf = (units: readonly LevelGraphemeUnit[]): number => {
  if (units.length === 0) return 1;
  let max = 1;
  for (const u of units) {
    const lvl = unitLevel(u);
    if (lvl !== undefined && lvl > max) max = lvl;
  }
  return max;
};

const chipsForLevel = (
  level: number,
): { value: string; label: string; units: LevelGraphemeUnit[] }[] => {
  const byPhoneme = new Map<string, LevelGraphemeUnit[]>();
  for (const u of GRAPHEMES_BY_LEVEL[level] ?? []) {
    if (u.p === '') continue;
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

const headerAriaPressed = (
  state: ReturnType<typeof headerStateForLevel>,
): 'true' | 'false' | 'mixed' => {
  if (state.kind === 'all-on') return 'true';
  if (state.kind === 'partial') return 'mixed';
  return 'false';
};

const headerSubtitle = (
  state: ReturnType<typeof headerStateForLevel>,
): string => {
  switch (state.kind) {
    case 'all-on': {
      return `${state.count} / ${state.total} sounds`;
    }
    case 'partial': {
      return `partial ${state.count} / ${state.total} sounds`;
    }
    case 'tiles-only': {
      return 'tiles only';
    }
    case 'not-in-scope': {
      return 'not in scope';
    }
  }
};

const headerBgClass = (
  state: ReturnType<typeof headerStateForLevel>,
): string => {
  switch (state.kind) {
    case 'all-on': {
      return 'bg-primary text-primary-foreground';
    }
    case 'partial': {
      return 'bg-primary/40 text-foreground';
    }
    case 'tiles-only': {
      return 'bg-muted text-foreground';
    }
    case 'not-in-scope': {
      return 'bg-muted/40 text-muted-foreground';
    }
  }
};

const LevelRow = ({
  level,
  selected,
  maxLevel,
  onChange,
}: {
  level: number;
  selected: LevelGraphemeUnit[];
  maxLevel: number;
  onChange: (next: LevelGraphemeUnit[]) => void;
}): JSX.Element => {
  const state = headerStateForLevel(level, selected, maxLevel);
  const chips = chipsForLevel(level);

  const isUnitOn = (u: LevelGraphemeUnit): boolean =>
    selected.some((s) => s.g === u.g && s.p === u.p);

  const handleHeader = () => {
    onChange(
      toggleLevel(
        level,
        selected,
        state.kind === 'all-on' ? 'unchecked' : 'checked',
      ),
    );
  };

  const handleChip = (units: LevelGraphemeUnit[]) => {
    let acc = selected;
    for (const u of units) acc = toggleUnit(u, acc);
    onChange(acc);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleHeader}
        aria-pressed={headerAriaPressed(state)}
        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${headerBgClass(state)}`}
      >
        <span>Level {level}</span>
        <span className="text-xs font-normal">
          {headerSubtitle(state)}
        </span>
      </button>

      <div className="flex flex-wrap gap-1">
        {chips.map((c) => {
          const on = c.units.every((u) => isUnitOn(u));
          const base = 'rounded-full px-2.5 py-1 text-xs font-bold';
          const cls = on
            ? `${base} bg-primary text-primary-foreground`
            : `${base} border border-border bg-muted text-foreground`;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => handleChip(c.units)}
              aria-pressed={on}
              aria-label={c.label}
              className={cls}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const buildPreviewFilter = (
  selected: LevelGraphemeUnit[],
  region: Region,
): WordFilter => {
  const resolved = resolveSimpleConfig({
    configMode: 'simple',
    selectedUnits: selected,
    region,
    inputMethod: 'drag',
  });
  return resolved.source!.filter;
};

export const WordSpellLibrarySource = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const selected = readSelected(config);
  const region = readRegion(config);
  const invalid = selected.length === 0;
  const maxLevel = maxLevelOf(selected);

  const setSelected = (next: LevelGraphemeUnit[]) => {
    onChange({ ...config, selectedUnits: next });
  };

  return (
    <div
      className="flex flex-col gap-4"
      data-invalid={invalid ? 'true' : 'false'}
    >
      {LEVELS.map((n) => (
        <LevelRow
          key={n}
          level={n}
          selected={selected}
          maxLevel={maxLevel}
          onChange={setSelected}
        />
      ))}
      <WordPreviewBar filter={buildPreviewFilter(selected, region)} />
      {invalid && (
        <p className="mt-2 text-xs text-destructive">
          Pick at least one sound to play.
        </p>
      )}
    </div>
  );
};
