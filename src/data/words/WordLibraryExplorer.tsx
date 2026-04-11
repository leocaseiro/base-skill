import { useEffect, useId, useMemo, useState } from 'react';
import { filterWords } from './filter';
import { ALL_REGIONS, LEVEL_LABELS } from './levels';
import { playPhoneme } from './phoneme-audio';
import type {
  FilterResult,
  Grapheme,
  Region,
  WordFilter,
  WordHit,
} from './types';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { speak } from '#/lib/speech/SpeechOutput';
import { cn } from '#/lib/utils';

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const SHOW_LIMIT = 100;

interface GraphemePair {
  g: string;
  p: string;
  label: string;
}

type SyllableMode = 'any' | 'eq' | 'range';

const pairLabel = (g: string, p: string): string => `${g}[${p}]`;

export const collectGraphemePairs = (
  hits: readonly WordHit[],
): GraphemePair[] => {
  const seen = new Map<string, GraphemePair>();
  for (const hit of hits) {
    if (!hit.graphemes) continue;
    for (const gr of hit.graphemes) {
      const label = pairLabel(gr.g, gr.p);
      if (!seen.has(label))
        seen.set(label, { g: gr.g, p: gr.p, label });
    }
  }
  return [...seen.values()].toSorted((a, b) =>
    a.label.localeCompare(b.label),
  );
};

export const collectGraphemeStrings = (
  hits: readonly WordHit[],
): string[] => {
  const seen = new Set<string>();
  for (const hit of hits) {
    if (!hit.graphemes) continue;
    for (const gr of hit.graphemes) seen.add(gr.g);
  }
  return [...seen].toSorted();
};

export const collectPhonemeStrings = (
  hits: readonly WordHit[],
): string[] => {
  const seen = new Set<string>();
  for (const hit of hits) {
    if (!hit.graphemes) continue;
    for (const gr of hit.graphemes) seen.add(gr.p);
  }
  return [...seen].toSorted();
};

const hitContainsAllPairs = (
  hit: WordHit,
  pairs: readonly GraphemePair[],
): boolean =>
  pairs.every((pair) =>
    hit.graphemes?.some((gr) => gr.g === pair.g && gr.p === pair.p),
  );

interface MultiSelectStringProps {
  label: string;
  helper?: string;
  options: readonly string[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
}

const MultiSelectString = ({
  label,
  helper,
  options,
  selected,
  onChange,
}: MultiSelectStringProps) => {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedSet = new Set(selected);
    return options
      .filter((opt) => !selectedSet.has(opt))
      .filter((opt) => (q ? opt.toLowerCase().includes(q) : true))
      .slice(0, 20);
  }, [options, query, selected]);

  const add = (value: string) => {
    if (selected.includes(value)) return;
    onChange([...selected, value]);
    setQuery('');
  };

  const remove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      {helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => (
            <Chip key={value} onRemove={() => remove(value)}>
              {value}
            </Chip>
          ))}
        </div>
      ) : null}
      <Input
        id={inputId}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search..."
        autoComplete="off"
      />
      {query.trim() !== '' && matches.length > 0 ? (
        <ul className="max-h-40 overflow-auto rounded-lg border border-input bg-popover text-sm">
          {matches.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => add(opt)}
                className="block w-full px-2.5 py-1 text-left hover:bg-muted"
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

interface MultiSelectPairsProps {
  label: string;
  helper?: string;
  options: readonly GraphemePair[];
  selected: readonly GraphemePair[];
  onChange: (next: GraphemePair[]) => void;
}

const MultiSelectPairs = ({
  label,
  helper,
  options,
  selected,
  onChange,
}: MultiSelectPairsProps) => {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedSet = new Set(selected.map((p) => p.label));
    return options
      .filter((opt) => !selectedSet.has(opt.label))
      .filter((opt) => (q ? opt.label.toLowerCase().includes(q) : true))
      .slice(0, 20);
  }, [options, query, selected]);

  const add = (pair: GraphemePair) => {
    if (selected.some((p) => p.label === pair.label)) return;
    onChange([...selected, pair]);
    setQuery('');
  };

  const remove = (label_: string) => {
    onChange(selected.filter((p) => p.label !== label_));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      {helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((pair) => (
            <Chip key={pair.label} onRemove={() => remove(pair.label)}>
              {pair.label}
            </Chip>
          ))}
        </div>
      ) : null}
      <Input
        id={inputId}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. c[k] or sh[ʃ]"
        autoComplete="off"
      />
      {query.trim() !== '' && matches.length > 0 ? (
        <ul className="max-h-40 overflow-auto rounded-lg border border-input bg-popover text-sm">
          {matches.map((opt) => (
            <li key={opt.label}>
              <button
                type="button"
                onClick={() => add(opt)}
                className="block w-full px-2.5 py-1 text-left hover:bg-muted"
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

interface ChipProps {
  children: React.ReactNode;
  onRemove: () => void;
}

const Chip = ({ children, onRemove }: ChipProps) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
    {children}
    <button
      type="button"
      onClick={onRemove}
      aria-label="Remove"
      className="text-muted-foreground hover:text-foreground"
    >
      ×
    </button>
  </span>
);

interface ResultCardProps {
  hit: WordHit;
}

interface KeyedGrapheme {
  key: string;
  g: string;
  p: string;
}

const keyGraphemes = (graphemes: Grapheme[]): KeyedGrapheme[] => {
  const counts = new Map<string, number>();
  return graphemes.map((gr) => {
    const base = `${gr.g}-${gr.p}`;
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    return { key: `${base}-${n}`, g: gr.g, p: gr.p };
  });
};

const GraphemeChips = ({ graphemes }: { graphemes: Grapheme[] }) => (
  <div className="flex flex-wrap gap-1">
    {keyGraphemes(graphemes).map((gr) => (
      <button
        key={gr.key}
        type="button"
        title={`${gr.g} → /${gr.p}/`}
        aria-label={`Play phoneme ${gr.p}`}
        onClick={() => {
          void playPhoneme(gr.p);
        }}
        className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs transition-colors hover:bg-muted/70"
      >
        {gr.g}
      </button>
    ))}
  </div>
);

const ResultCard = ({ hit }: ResultCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-start justify-between gap-2">
        <span className="text-2xl font-bold">{hit.word}</span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Play ${hit.word}`}
          onClick={() => speak(hit.word, { rate: 0.9, lang: 'en-AU' })}
        >
          🔊
        </Button>
      </CardTitle>
      {hit.ipa ? (
        <p className="font-mono text-sm text-muted-foreground">
          /{hit.ipa}/
        </p>
      ) : null}
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1 text-xs">
        <Badge>L{hit.level}</Badge>
        <Badge>{hit.syllableCount} syl</Badge>
        {hit.syllables ? (
          <Badge>{hit.syllables.join('-')}</Badge>
        ) : null}
      </div>
      {hit.graphemes ? (
        <GraphemeChips graphemes={hit.graphemes} />
      ) : null}
    </CardContent>
  </Card>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">
    {children}
  </span>
);

const updateLevels = (
  current: readonly number[] | undefined,
  level: number,
): number[] => {
  const set = new Set(current);
  if (set.has(level)) set.delete(level);
  else set.add(level);
  return [...set].toSorted((a, b) => a - b);
};

export const WordLibraryExplorer = () => {
  const [filter, setFilter] = useState<WordFilter>({
    region: 'aus',
    fallbackToAus: true,
  });
  const [result, setResult] = useState<FilterResult>({ hits: [] });
  const [syllableMode, setSyllableMode] = useState<SyllableMode>('any');
  const [graphemePairs, setGraphemePairs] = useState<GraphemePair[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;
    filterWords(filter).then((next) => {
      if (!cancelled) setResult(next);
    });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const pairOptions = useMemo(
    () => collectGraphemePairs(result.hits),
    [result.hits],
  );
  const graphemeOptions = useMemo(
    () => collectGraphemeStrings(result.hits),
    [result.hits],
  );
  const phonemeOptions = useMemo(
    () => collectPhonemeStrings(result.hits),
    [result.hits],
  );

  // graphemePairs is a client-only post-filter; the WordFilter API does not
  // support (g,p) tuples yet, so we apply it after filterWords resolves.
  const postFiltered = useMemo(() => {
    if (graphemePairs.length === 0) return result.hits;
    return result.hits.filter((hit) =>
      hitContainsAllPairs(hit, graphemePairs),
    );
  }, [result.hits, graphemePairs]);

  const totalBeforeFilters = result.hits.length;
  const matched = postFiltered.length;
  const shown = Math.min(matched, SHOW_LIMIT);
  const visible = postFiltered.slice(0, SHOW_LIMIT);

  const setLevels = (levels: number[]) => {
    setFilter((f) => ({
      ...f,
      levels: levels.length > 0 ? levels : undefined,
    }));
  };

  const setSyllables = (mode: SyllableMode) => {
    setSyllableMode(mode);
    setFilter((f) => ({
      ...f,
      syllableCountEq: undefined,
      syllableCountRange: undefined,
    }));
  };

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-background p-4 text-foreground md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-4 md:w-80">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <RegionField />
            <LevelsField
              selected={filter.levels}
              onToggle={(level) =>
                setLevels(updateLevels(filter.levels, level))
              }
              onClear={() => setLevels([])}
              range={filter.levelRange}
              onRangeChange={(next) =>
                setFilter((f) => ({ ...f, levelRange: next }))
              }
            />
            <SyllablesField
              mode={syllableMode}
              onModeChange={setSyllables}
              eq={filter.syllableCountEq}
              range={filter.syllableCountRange}
              onEq={(n) =>
                setFilter((f) => ({ ...f, syllableCountEq: n }))
              }
              onRange={(r) =>
                setFilter((f) => ({ ...f, syllableCountRange: r }))
              }
            />
            <FallbackField
              checked={filter.fallbackToAus !== false}
              onChange={(v) =>
                setFilter((f) => ({ ...f, fallbackToAus: v }))
              }
            />
            <AdvancedSection
              pairOptions={pairOptions}
              graphemeOptions={graphemeOptions}
              phonemeOptions={phonemeOptions}
              graphemePairs={graphemePairs}
              onGraphemePairsChange={setGraphemePairs}
              graphemesAllowed={filter.graphemesAllowed ?? []}
              onGraphemesAllowedChange={(next) =>
                setFilter((f) => ({
                  ...f,
                  graphemesAllowed: next.length > 0 ? next : undefined,
                }))
              }
              graphemesRequired={filter.graphemesRequired ?? []}
              onGraphemesRequiredChange={(next) =>
                setFilter((f) => ({
                  ...f,
                  graphemesRequired: next.length > 0 ? next : undefined,
                }))
              }
              phonemesAllowed={filter.phonemesAllowed ?? []}
              onPhonemesAllowedChange={(next) =>
                setFilter((f) => ({
                  ...f,
                  phonemesAllowed: next.length > 0 ? next : undefined,
                }))
              }
              phonemesRequired={filter.phonemesRequired ?? []}
              onPhonemesRequiredChange={(next) =>
                setFilter((f) => ({
                  ...f,
                  phonemesRequired: next.length > 0 ? next : undefined,
                }))
              }
            />
          </CardContent>
        </Card>
      </aside>
      <main className="flex flex-1 flex-col gap-4">
        {result.usedFallback ? (
          <Card>
            <CardContent className="pt-4 text-sm text-muted-foreground">
              Showing AUS fallback — requested region{' '}
              <code>{result.usedFallback.from}</code> has no entries.
            </CardContent>
          </Card>
        ) : null}
        <div className="flex items-baseline gap-2 text-sm">
          <span className="font-medium">
            Showing {shown} of {matched}
          </span>
          <span className="text-muted-foreground">
            (filtered from {totalBeforeFilters})
          </span>
          {matched > SHOW_LIMIT ? (
            <span className="text-muted-foreground">
              (first {SHOW_LIMIT})
            </span>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((hit) => (
            <ResultCard key={`${hit.region}-${hit.word}`} hit={hit} />
          ))}
        </div>
      </main>
    </div>
  );
};

interface AdvancedSectionProps {
  pairOptions: readonly GraphemePair[];
  graphemeOptions: readonly string[];
  phonemeOptions: readonly string[];
  graphemePairs: readonly GraphemePair[];
  onGraphemePairsChange: (next: GraphemePair[]) => void;
  graphemesAllowed: readonly string[];
  onGraphemesAllowedChange: (next: string[]) => void;
  graphemesRequired: readonly string[];
  onGraphemesRequiredChange: (next: string[]) => void;
  phonemesAllowed: readonly string[];
  onPhonemesAllowedChange: (next: string[]) => void;
  phonemesRequired: readonly string[];
  onPhonemesRequiredChange: (next: string[]) => void;
}

const AdvancedSection = ({
  pairOptions,
  graphemeOptions,
  phonemeOptions,
  graphemePairs,
  onGraphemePairsChange,
  graphemesAllowed,
  onGraphemesAllowedChange,
  graphemesRequired,
  onGraphemesRequiredChange,
  phonemesAllowed,
  onPhonemesAllowedChange,
  phonemesRequired,
  onPhonemesRequiredChange,
}: AdvancedSectionProps) => (
  <details className="flex flex-col gap-3 rounded-lg border border-border p-3">
    <summary className="cursor-pointer text-sm font-medium select-none">
      Advanced filters
    </summary>
    <div className="mt-3 flex flex-col gap-4">
      <MultiSelectPairs
        label="Grapheme-phoneme pairs"
        helper="Post-filter. Hit must include every selected pair."
        options={pairOptions}
        selected={graphemePairs}
        onChange={onGraphemePairsChange}
      />
      <MultiSelectString
        label="Graphemes allowed"
        helper="Hit's graphemes must all be in this set."
        options={graphemeOptions}
        selected={graphemesAllowed}
        onChange={onGraphemesAllowedChange}
      />
      <MultiSelectString
        label="Graphemes required"
        helper="Hit must contain at least one of these."
        options={graphemeOptions}
        selected={graphemesRequired}
        onChange={onGraphemesRequiredChange}
      />
      <MultiSelectString
        label="Phonemes allowed"
        helper="Hit's phonemes must all be in this set."
        options={phonemeOptions}
        selected={phonemesAllowed}
        onChange={onPhonemesAllowedChange}
      />
      <MultiSelectString
        label="Phonemes required"
        helper="Hit must contain at least one of these."
        options={phonemeOptions}
        selected={phonemesRequired}
        onChange={onPhonemesRequiredChange}
      />
    </div>
  </details>
);

const RegionField = () => (
  <div className="flex flex-col gap-1.5">
    <Label>Region</Label>
    <Select value="aus" disabled>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALL_REGIONS.map((r: Region) => (
          <SelectItem key={r} value={r}>
            {r.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <p className="text-xs text-muted-foreground">
      UK / US / BR coming later.
    </p>
  </div>
);

interface LevelsFieldProps {
  selected: readonly number[] | undefined;
  onToggle: (level: number) => void;
  onClear: () => void;
  range: readonly [number, number] | undefined;
  onRangeChange: (next?: [number, number]) => void;
}

const LevelsField = ({
  selected,
  onToggle,
  onClear,
  range,
  onRangeChange,
}: LevelsFieldProps) => {
  const sel = new Set(selected);
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Levels</Label>
      <div className="flex flex-wrap gap-1">
        {LEVELS.map((level) => {
          const active = sel.has(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => onToggle(level)}
              aria-pressed={active}
              className={cn(
                'rounded-md border border-input px-2 py-1 text-xs transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent hover:bg-muted',
              )}
            >
              {LEVEL_LABELS.aus(level)}
            </button>
          );
        })}
      </div>
      {sel.size > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-xs text-muted-foreground hover:text-foreground"
        >
          Clear levels
        </button>
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">
        Or set a range (ANDs with chips when both are set):
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={8}
          placeholder="min"
          value={range?.[0] ?? ''}
          onChange={(e) => {
            if (e.target.value === '') {
              onRangeChange();
              return;
            }
            const min = Number(e.target.value);
            const max = range?.[1] ?? min;
            if (Number.isFinite(min)) onRangeChange([min, max]);
          }}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          min={1}
          max={8}
          placeholder="max"
          value={range?.[1] ?? ''}
          onChange={(e) => {
            if (e.target.value === '') {
              onRangeChange();
              return;
            }
            const max = Number(e.target.value);
            const min = range?.[0] ?? max;
            if (Number.isFinite(max)) onRangeChange([min, max]);
          }}
        />
      </div>
    </div>
  );
};

interface SyllablesFieldProps {
  mode: SyllableMode;
  onModeChange: (mode: SyllableMode) => void;
  eq: number | undefined;
  range: readonly [number, number] | undefined;
  onEq: (n: number | undefined) => void;
  onRange: (r: [number, number] | undefined) => void;
}

const SyllablesField = ({
  mode,
  onModeChange,
  eq,
  range,
  onEq,
  onRange,
}: SyllablesFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <Label>Syllables</Label>
    <div className="flex gap-3 text-xs">
      <RadioOption
        name="syllable-mode"
        value="any"
        current={mode}
        onChange={onModeChange}
        label="Any"
      />
      <RadioOption
        name="syllable-mode"
        value="eq"
        current={mode}
        onChange={onModeChange}
        label="Exactly"
      />
      <RadioOption
        name="syllable-mode"
        value="range"
        current={mode}
        onChange={onModeChange}
        label="Range"
      />
    </div>
    {mode === 'eq' ? (
      <Input
        type="number"
        min={1}
        value={eq ?? ''}
        onChange={(e) => {
          const n =
            e.target.value === '' ? undefined : Number(e.target.value);
          onEq(Number.isFinite(n) ? n : undefined);
        }}
      />
    ) : null}
    {mode === 'range' ? (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          placeholder="min"
          value={range?.[0] ?? ''}
          onChange={(e) => {
            const min = Number(e.target.value);
            const max = range?.[1] ?? min;
            if (Number.isFinite(min)) onRange([min, max]);
          }}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          min={1}
          placeholder="max"
          value={range?.[1] ?? ''}
          onChange={(e) => {
            const max = Number(e.target.value);
            const min = range?.[0] ?? max;
            if (Number.isFinite(max)) onRange([min, max]);
          }}
        />
      </div>
    ) : null}
  </div>
);

interface RadioOptionProps {
  name: string;
  value: SyllableMode;
  current: SyllableMode;
  onChange: (v: SyllableMode) => void;
  label: string;
}

const RadioOption = ({
  name,
  value,
  current,
  onChange,
  label,
}: RadioOptionProps) => {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-center gap-1">
      <input
        id={id}
        type="radio"
        name={name}
        checked={current === value}
        onChange={() => onChange(value)}
      />
      {label}
    </label>
  );
};

interface FallbackFieldProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

const FallbackField = ({ checked, onChange }: FallbackFieldProps) => {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <Label htmlFor={id} className="flex flex-col items-start gap-0.5">
        <span>Fallback to AUS</span>
        <span className="text-xs font-normal text-muted-foreground">
          When the requested region has no hits, fall back to AUS.
        </span>
      </Label>
    </div>
  );
};
