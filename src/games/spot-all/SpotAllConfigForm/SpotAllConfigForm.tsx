import { useTranslation } from 'react-i18next';
import { CONFUSABLE_GROUPS } from '../confusable-pair-groups';
import { resolveSimpleConfig } from '../resolve-simple-config';
import type {
  ConfusableGroup,
  ConfusableGroupChip,
} from '../confusable-pair-groups';
import type { SelectedConfusablePair, SpotAllConfig } from '../types';
import type { JSX } from 'react';

type FormConfig = Partial<SpotAllConfig> & Record<string, unknown>;

const samePair = (
  a: SelectedConfusablePair,
  b: SelectedConfusablePair,
): boolean => a.pair[0] === b.pair[0] && a.pair[1] === b.pair[1];

const tripleSetPairs = (
  members: readonly [string, string, string],
): SelectedConfusablePair[] => [
  { pair: [members[0], members[1]], type: 'visual-similarity' },
  { pair: [members[0], members[2]], type: 'visual-similarity' },
  { pair: [members[1], members[2]], type: 'visual-similarity' },
];

const chipPairs = (
  chip: ConfusableGroupChip,
): SelectedConfusablePair[] => {
  if (chip.kind === 'pair')
    return [{ pair: chip.pair, type: chip.type }];
  if (chip.kind === 'tripleSet') return tripleSetPairs(chip.members);
  return [];
};

export const SpotAllConfigForm = ({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const current = config as FormConfig;
  const selectedPairs = current.selectedConfusablePairs ?? [];
  const selectedReversibles = current.selectedReversibleChars ?? [];

  const isPairSelected = (p: SelectedConfusablePair): boolean =>
    selectedPairs.some((sp) => samePair(sp, p));
  const isReversibleSelected = (char: string): boolean =>
    selectedReversibles.includes(char);

  const isChipSelected = (chip: ConfusableGroupChip): boolean => {
    if (chip.kind === 'reversible')
      return isReversibleSelected(chip.char);
    return chipPairs(chip).every((p) => isPairSelected(p));
  };

  const isGroupAllOn = (group: ConfusableGroup): boolean =>
    group.chips.length > 0 &&
    group.chips.every((c) => isChipSelected(c));

  const commit = (
    nextPairs: SelectedConfusablePair[],
    nextReversibles: string[],
  ): void => {
    const resolved = resolveSimpleConfig({
      configMode: 'simple',
      selectedConfusablePairs: nextPairs,
      selectedReversibleChars: nextReversibles,
    });
    onChange({ ...current, ...resolved });
  };

  const toggleChip = (chip: ConfusableGroupChip): void => {
    if (chip.kind === 'reversible') {
      const next = isReversibleSelected(chip.char)
        ? selectedReversibles.filter((c) => c !== chip.char)
        : [...selectedReversibles, chip.char];
      commit(selectedPairs, next);
      return;
    }
    const pairs = chipPairs(chip);
    const allOn = pairs.every((p) => isPairSelected(p));
    const next = allOn
      ? selectedPairs.filter(
          (sp) => !pairs.some((p) => samePair(sp, p)),
        )
      : [...selectedPairs, ...pairs.filter((p) => !isPairSelected(p))];
    commit(next, selectedReversibles);
  };

  const toggleGroup = (group: ConfusableGroup): void => {
    const allOn = isGroupAllOn(group);
    if (group.id === 'reversible') {
      const chars = group.chips.flatMap((c) =>
        c.kind === 'reversible' ? [c.char] : [],
      );
      const next = allOn
        ? selectedReversibles.filter((c) => !chars.includes(c))
        : [...new Set([...selectedReversibles, ...chars])];
      commit(selectedPairs, next);
      return;
    }
    const groupPairs = group.chips.flatMap((c) => chipPairs(c));
    const next = allOn
      ? selectedPairs.filter(
          (sp) => !groupPairs.some((p) => samePair(sp, p)),
        )
      : [
          ...selectedPairs,
          ...groupPairs.filter((p) => !isPairSelected(p)),
        ];
    commit(next, selectedReversibles);
  };

  const empty =
    selectedPairs.length === 0 && selectedReversibles.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {CONFUSABLE_GROUPS.map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => toggleGroup(group)}
            className={[
              'rounded-lg px-3 py-2 text-left font-semibold transition-colors',
              isGroupAllOn(group)
                ? 'bg-primary text-primary-foreground'
                : group.chips.some((c) => isChipSelected(c))
                  ? 'bg-primary/40 text-primary-foreground'
                  : 'bg-muted text-foreground',
            ].join(' ')}
          >
            {t(`spot-all-ui.config.groups.${group.id}`)}
          </button>
          <div className="flex flex-wrap gap-2 pl-2">
            {group.chips.map((chip) => (
              <button
                key={chipKey(chip)}
                type="button"
                onClick={() => toggleChip(chip)}
                className={[
                  'rounded-full border px-3 py-1 text-sm',
                  isChipSelected(chip)
                    ? 'border-primary bg-primary/20'
                    : 'border-border bg-card',
                ].join(' ')}
              >
                <ChipLabel chip={chip} />
              </button>
            ))}
          </div>
        </div>
      ))}
      {empty && (
        <p className="text-destructive">
          {t('spot-all-ui.config.invalid-selection')}
        </p>
      )}
    </div>
  );
};

const chipKey = (chip: ConfusableGroupChip): string => {
  if (chip.kind === 'pair') return `pair:${chip.pair.join('-')}`;
  if (chip.kind === 'tripleSet')
    return `triple:${chip.members.join('-')}`;
  return `rev:${chip.char}`;
};

const REVERSIBLE_CSS_TRANSFORM: Record<string, string> = {
  'mirror-horizontal': 'scaleX(-1)',
  'mirror-vertical': 'scaleY(-1)',
  'rotation-180': 'rotate(180deg)',
};

const ChipLabel = ({
  chip,
}: {
  chip: ConfusableGroupChip;
}): JSX.Element => {
  if (chip.kind === 'pair')
    return <>{`${chip.pair[0]} ↔ ${chip.pair[1]}`}</>;
  if (chip.kind === 'tripleSet') return <>{chip.members.join(', ')}</>;
  const cssTransform =
    REVERSIBLE_CSS_TRANSFORM[chip.transform] ?? 'scaleX(-1)';
  return (
    <>
      {chip.char} ↔{' '}
      <span
        style={{ display: 'inline-block', transform: cssTransform }}
        aria-hidden="true"
      >
        {chip.char}
      </span>
    </>
  );
};
