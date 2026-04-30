import { confusablePairsSource } from './sources/confusable-pairs';
import { reversibleCharsSource } from './sources/reversible-chars';
import type { DistractorSource } from './types';

const SOURCES = new Map<string, DistractorSource>();

export const registerSource = (s: DistractorSource): void => {
  SOURCES.set(s.id, s);
};

export const getSource = (id: string): DistractorSource | undefined =>
  SOURCES.get(id);

export const listSources = (): DistractorSource[] => [
  ...SOURCES.values(),
];

// Auto-register built-ins
registerSource(confusablePairsSource);
registerSource(reversibleCharsSource);
