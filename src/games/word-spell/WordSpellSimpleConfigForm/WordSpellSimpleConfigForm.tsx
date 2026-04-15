import type { JSX } from 'react';
import { CellSelect } from '@/components/config/CellSelect';
import { ChipStrip } from '@/components/config/ChipStrip';
import { ChunkGroup } from '@/components/config/ChunkGroup';
import { GRAPHEMES_BY_LEVEL } from '@/data/words/levels';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

const LEVEL_OPTIONS = Object.keys(GRAPHEMES_BY_LEVEL).map((n) => ({
  value: n,
  label: `Level ${n}`,
}));

export const WordSpellSimpleConfigForm = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const source =
    typeof config.source === 'object' && config.source !== null
      ? (config.source as {
          type: 'word-library';
          filter: {
            region: string;
            level: number;
            phonemesAllowed?: string[];
          };
        })
      : undefined;
  const level =
    typeof source?.filter.level === 'number' ? source.filter.level : 1;
  const phonemesAllowed = source?.filter.phonemesAllowed ?? [];
  const inputMethod =
    config.inputMethod === 'type' || config.inputMethod === 'both'
      ? config.inputMethod
      : 'drag';

  const unitsAtLevel = GRAPHEMES_BY_LEVEL[level] ?? [];
  const chips = unitsAtLevel.map((u) => ({
    value: u.p,
    label: `${u.g} /${u.p}/`,
  }));

  const setLevel = (n: number) => {
    const available = (GRAPHEMES_BY_LEVEL[n] ?? []).map((u) => u.p);
    onChange({
      ...config,
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: n,
          phonemesAllowed: available,
        },
      },
    });
  };

  const setPhonemes = (next: string[]) => {
    onChange({
      ...config,
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level,
          phonemesAllowed: next,
        },
      },
    });
  };

  const invalid = phonemesAllowed.length === 0;

  return (
    <div
      className="flex flex-col gap-4"
      data-invalid={invalid ? 'true' : 'false'}
    >
      <div className="flex flex-col gap-1 text-xs font-semibold uppercase text-muted-foreground">
        Level
        <CellSelect
          label="Level"
          value={String(level)}
          options={LEVEL_OPTIONS}
          onChange={(v) => setLevel(Number(v))}
        />
      </div>

      <div>
        <div className="text-xs font-semibold uppercase text-muted-foreground">
          Sounds at this level (tap to toggle)
        </div>
        <div className="mt-2">
          <ChipStrip
            chips={chips}
            selected={phonemesAllowed}
            mode="toggleable"
            onChange={setPhonemes}
          />
        </div>
        {invalid && (
          <p className="mt-2 text-xs text-destructive">
            Pick at least one sound to play.
          </p>
        )}
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
