// src/lib/config-tags.ts
type Formatter = (v: unknown) => string | null;

const KEY_FORMATTERS: [string, Formatter][] = [
  ['inputMethod', String],
  ['mode', String],
  ['tileUnit', String],
  ['direction', String],
  ['totalRounds', (v) => `${String(v)} rounds`],
  ['ttsEnabled', (v) => (v === true ? 'TTS on' : null)],
];

export const configToTags = (
  config: Record<string, unknown> | undefined,
): string[] => {
  if (!config) return [];
  const tags: string[] = [];
  for (const [key, format] of KEY_FORMATTERS) {
    if (key in config) {
      const result = format(config[key]);
      if (result !== null) tags.push(result);
    }
    if (tags.length === 4) break;
  }
  return tags;
};
