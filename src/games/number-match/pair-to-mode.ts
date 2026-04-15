import type { NumberMatchMode } from './types';

export type Primitive = 'numeral' | 'group' | 'word' | 'ordinal';

const PAIRS: Record<string, NumberMatchMode> = {
  'numeral->group': 'numeral-to-group',
  'group->numeral': 'group-to-numeral',
  'numeral->word': 'cardinal-number-to-text',
  'word->numeral': 'cardinal-text-to-number',
  'ordinal->word': 'ordinal-number-to-text',
  'word->ordinal': 'ordinal-text-to-number',
  'numeral->ordinal': 'cardinal-to-ordinal',
  'ordinal->numeral': 'ordinal-to-cardinal',
};

export const pairToMode = (
  from: Primitive,
  to: Primitive,
): NumberMatchMode => {
  const key = `${from}->${to}`;
  const mode = PAIRS[key];
  if (!mode) throw new Error(`invalid pair: ${key}`);
  return mode;
};

export const modeToPair = (
  mode: NumberMatchMode,
): { from: Primitive; to: Primitive } => {
  const entry = Object.entries(PAIRS).find(([, v]) => v === mode);
  if (!entry) throw new Error(`unknown mode: ${mode}`);
  const [from, to] = entry[0].split('->') as [Primitive, Primitive];
  return { from, to };
};

export const validToValues = (from: Primitive): Primitive[] =>
  Object.keys(PAIRS)
    .filter((k) => k.startsWith(`${from}->`))
    .map((k) => k.split('->')[1] as Primitive);
