import { ALL_REGIONS } from './levels';
import type {
  CurriculumEntry,
  DraftEntry,
  FilterResult,
  Provenance,
  Region,
  WordCore,
  WordFilter,
  WordHit,
} from './types';

const inRange = (
  n: number,
  [min, max]: readonly [number, number],
): boolean => n >= min && n <= max;

export const isLevelInFilter = (
  filter: WordFilter,
  level: number,
): boolean => {
  if (filter.level !== undefined && filter.level !== level)
    return false;
  if (filter.levels && !filter.levels.includes(level)) return false;
  if (filter.levelRange && !inRange(level, filter.levelRange))
    return false;
  return true;
};

export const entryMatches = (
  hit: WordHit,
  filter: WordFilter,
): boolean => {
  if (hit.region !== filter.region) return false;

  if (filter.level !== undefined && hit.level !== filter.level)
    return false;
  if (filter.levels && !filter.levels.includes(hit.level)) return false;
  if (filter.levelRange && !inRange(hit.level, filter.levelRange))
    return false;

  if (
    filter.syllableCountEq !== undefined &&
    hit.syllableCount !== filter.syllableCountEq
  )
    return false;
  if (
    filter.syllableCountRange &&
    !inRange(hit.syllableCount, filter.syllableCountRange)
  )
    return false;

  const hasGraphemeFilter =
    filter.graphemesAllowed !== undefined ||
    filter.graphemesRequired !== undefined ||
    filter.phonemesAllowed !== undefined ||
    filter.phonemesRequired !== undefined;

  if (!hasGraphemeFilter) return true;
  if (!hit.graphemes) return false;

  if (filter.graphemesAllowed) {
    const allowed = new Set(
      filter.graphemesAllowed.map((u) => `${u.g}|${u.p}`),
    );
    if (!hit.graphemes.every((g) => allowed.has(`${g.g}|${g.p}`)))
      return false;
  }
  if (filter.graphemesRequired) {
    const required = new Set(
      filter.graphemesRequired.map((u) => `${u.g}|${u.p}`),
    );
    if (!hit.graphemes.some((g) => required.has(`${g.g}|${g.p}`)))
      return false;
  }
  if (filter.phonemesAllowed) {
    const allowed = new Set(filter.phonemesAllowed);
    if (!hit.graphemes.every((g) => allowed.has(g.p))) return false;
  }
  if (filter.phonemesRequired) {
    const required = new Set(filter.phonemesRequired);
    if (!hit.graphemes.some((g) => required.has(g.p))) return false;
  }

  return true;
};

const coreLoaders = import.meta.glob<{ default: WordCore[] }>(
  './core/level*.json',
);
const ausLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  './curriculum/aus/level*.json',
);
const ukLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  './curriculum/uk/level*.json',
);
const usLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  './curriculum/us/level*.json',
);
const brLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  './curriculum/br/level*.json',
);

const loadersForRegion = (
  region: Region,
): Record<string, () => Promise<{ default: CurriculumEntry[] }>> => {
  switch (region) {
    case 'aus': {
      return ausLoaders;
    }
    case 'uk': {
      return ukLoaders;
    }
    case 'us': {
      return usLoaders;
    }
    case 'br': {
      return brLoaders;
    }
  }
};

let coreCache: Map<string, WordCore> | null = null;
const curriculumCache: Partial<Record<Region, CurriculumEntry[]>> = {};

export const __resetChunkCacheForTests = (): void => {
  coreCache = null;
  for (const r of ALL_REGIONS) delete curriculumCache[r];
};

const loadCore = async (): Promise<Map<string, WordCore>> => {
  if (coreCache) return coreCache;
  const map = new Map<string, WordCore>();
  const chunks = await Promise.all(
    Object.values(coreLoaders).map((load) => load()),
  );
  for (const chunk of chunks) {
    for (const entry of chunk.default) map.set(entry.word, entry);
  }
  coreCache = map;
  return map;
};

const loadCurriculum = async (
  region: Region,
): Promise<CurriculumEntry[]> => {
  if (curriculumCache[region]) return curriculumCache[region];
  const chunks = await Promise.all(
    Object.values(loadersForRegion(region)).map((load) => load()),
  );
  const flat = chunks.flatMap((c) => c.default);
  curriculumCache[region] = flat;
  return flat;
};

const draftToHit = (d: DraftEntry): WordHit => ({
  word: d.word,
  region: d.region,
  level: d.level,
  syllableCount: d.syllableCount,
  syllables: d.syllables,
  variants: d.variants,
  ipa: d.ipa || undefined,
  graphemes: d.graphemes,
  provenance: 'draft' satisfies Provenance,
  draftId: d.id,
});

const joinHits = (
  curriculum: CurriculumEntry[],
  core: Map<string, WordCore>,
  region: Region,
): WordHit[] =>
  curriculum.flatMap((entry) => {
    const c = core.get(entry.word);
    if (!c) return [];
    return [
      {
        word: entry.word,
        region,
        level: entry.level,
        syllableCount: c.syllableCount,
        syllables: c.syllables,
        variants: c.variants,
        ipa: entry.ipa || undefined,
        graphemes: entry.graphemes,
        provenance: 'shipped',
      } as WordHit,
    ];
  });

const sortByWord = (hits: WordHit[]): WordHit[] =>
  hits.toSorted((a, b) => a.word.localeCompare(b.word));

export const loadShippedIndex = async (
  region: Region,
): Promise<Set<string>> => {
  const curriculum = await loadCurriculum(region);
  return new Set(curriculum.map((entry) => entry.word));
};

export const loadShippedWordLevels = async (
  region: Region,
): Promise<Map<string, number>> => {
  const curriculum = await loadCurriculum(region);
  const map = new Map<string, number>();
  for (const entry of curriculum) {
    const existing = map.get(entry.word);
    if (existing === undefined || entry.level < existing) {
      map.set(entry.word, entry.level);
    }
  }
  return map;
};

export const filterWords = async (
  filter: WordFilter,
): Promise<FilterResult> => {
  const core = await loadCore();
  const curriculum = await loadCurriculum(filter.region);
  const shipped = joinHits(curriculum, core, filter.region).filter(
    (h) => entryMatches(h, filter),
  );

  // Lazy import to avoid Dexie singleton conflicts in environments
  // that also load RxDB (which bundles a different Dexie version).
  const { draftStore } = await import('./authoring/draftStore');
  const allDrafts = await draftStore.listDrafts({
    region: filter.region,
  });
  const drafts = allDrafts
    .map((d) => draftToHit(d))
    .filter((h) => entryMatches(h, filter));

  if (
    shipped.length > 0 ||
    drafts.length > 0 ||
    filter.region === 'aus' ||
    filter.fallbackToAus === false
  ) {
    // Drafts shadow shipped entries for the same word — the draft is
    // treated as the authoritative working copy (this is how the
    // "edit shipped" flow persists corrections without mutating the
    // curriculum JSON at runtime).
    const draftWords = new Set(drafts.map((d) => d.word));
    const shippedOnly = shipped.filter((s) => !draftWords.has(s.word));
    return { hits: sortByWord([...shippedOnly, ...drafts]) };
  }

  const ausCurriculum = await loadCurriculum('aus');
  const ausShipped = joinHits(ausCurriculum, core, 'aus').filter((h) =>
    entryMatches(h, { ...filter, region: 'aus' }),
  );
  const ausDrafts = await draftStore.listDrafts({ region: 'aus' });
  const ausFilteredDrafts = ausDrafts
    .map((d) => draftToHit(d))
    .filter((h) => entryMatches(h, { ...filter, region: 'aus' }));
  const ausDraftWords = new Set(ausFilteredDrafts.map((d) => d.word));
  const ausShippedOnly = ausShipped.filter(
    (s) => !ausDraftWords.has(s.word),
  );
  return {
    hits: sortByWord([...ausShippedOnly, ...ausFilteredDrafts]),
    usedFallback: { from: filter.region, to: 'aus' },
  };
};
