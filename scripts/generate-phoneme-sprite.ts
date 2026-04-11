// scripts/generate-phoneme-sprite.ts
//
// Generates public/audio/phonemes.mp3 + phonemes.json from the IPA phonemes
// used in the AUS corpus. Uses eSpeak-NG (GPL v3 — audio output unrestricted)
// as the TTS backend, feeding Kirshenbaum phoneme codes directly so every
// clip is linguistically accurate rather than an "approximation map".
//
// Requires: espeak-ng, ffmpeg on PATH. Run: `yarn generate:phonemes`.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const corpusDir = path.join(repoRoot, 'src/data/words/curriculum/aus');
const outDir = path.join(repoRoot, 'public/audio');
const tmpDir = path.join(repoRoot, '.tmp/phoneme-sprite');

const GAP_SEC = 0.25;
const SAMPLE_RATE = 22_050;

/**
 * IPA → Kirshenbaum ASCII phoneme codes for eSpeak-NG `[[...]]` input.
 * Single consonants get a trailing schwa because stops are inaudible in
 * isolation. Vowels and diphthongs speak alone. Clusters (ks, kw, juː) are
 * multi-phoneme sequences the corpus treats as a single grapheme sound.
 */
const IPA_TO_KIRSH: Record<string, string> = {
  // Consonants
  p: 'p',
  b: 'b',
  t: 't',
  d: 'd',
  k: 'k',
  g: 'g',
  f: 'f',
  v: 'v',
  s: 's',
  z: 'z',
  h: 'h',
  θ: 'T',
  ð: 'D',
  ʃ: 'S',
  ʒ: 'Z',
  tʃ: 'tS',
  dʒ: 'dZ',
  m: 'm',
  n: 'n',
  ŋ: 'N',
  l: 'l',
  r: 'r',
  w: 'w',
  j: 'j',
  // Multi-phoneme clusters the corpus stores as one grapheme `p` value
  ks: 'ks',
  kw: 'kw',
  juː: 'ju:',
  // Short vowels. `æ` and `ɒ` use `a` and `0` respectively because the
  // canonical Kirshenbaum codes `&` and `A` render as digital silence in
  // the en-US voice (verified via volumedetect against bare eSpeak output).
  e: 'E',
  æ: 'a',
  ɒ: '0',
  ʌ: 'V',
  ʊ: 'U',
  ɪ: 'I',
  ə: '@',
  // Long vowels
  iː: 'i:',
  uː: 'u:',
  ɑː: 'A:',
  ɔː: 'O:',
  ɜː: '3:',
  // Diphthongs
  aɪ: 'aI',
  aʊ: 'aU',
  eɪ: 'eI',
  oʊ: 'oU',
  ɔɪ: 'OI',
  eə: 'e@',
  ɛə: 'e@',
  ɪə: 'I@',
};

const CONSONANTS = new Set([
  'p',
  'b',
  't',
  'd',
  'k',
  'g',
  'f',
  'v',
  's',
  'z',
  'h',
  'θ',
  'ð',
  'ʃ',
  'ʒ',
  'tʃ',
  'dʒ',
  'm',
  'n',
  'ŋ',
  'l',
  'r',
  'w',
  'j',
  'ks',
  'kw',
]);

/**
 * Per-phoneme sustain tuning. Every dial is exposed here so individual
 * sounds can be adjusted without touching the rest of the corpus.
 *
 * - `anchor`: what follows the Kirshenbaum code inside `[[...]]`. Empty
 *   for bare rendering (fricatives + vowels), `@` for the schwa release
 *   sonorants need, `E` for the `/ɛ/` anchor plosives use so chips say
 *   "teh"/"peh" instead of "tuh"/"puh".
 * - `trimDb`: silenceremove threshold, or `null` to skip the trim pass.
 *   Voiced fricatives peak very low so they need `-60`; vowels and
 *   sonorants are fine at `-40`.
 * - `stretch`: atempo multiplier (`1 | 2 | 4`). `4` chains two
 *   atempo=0.5 passes; anything beyond that would need more chaining.
 * - `fadeMs`: symmetric afade at both edges. Set to 0 to keep the loop
 *   seam gap-free (cost: potential click, usually masked by noise).
 * - `loopable`: marks the sprite entry so WebAudio wraps the segment
 *   on hover-sustain.
 */
interface PhonemeConfig {
  readonly anchor: '' | '@' | 'E';
  readonly trimDb: number | null;
  readonly stretch: 1 | 2 | 4;
  readonly fadeMs: number;
  readonly loopable: boolean;
}

const PHONEME_CONFIG: Record<string, PhonemeConfig> = {
  // Fricatives — bare, 4x stretch, no fade (noise masks seam clicks)
  s: { anchor: '', trimDb: -60, stretch: 4, fadeMs: 0, loopable: true },
  z: { anchor: '', trimDb: -60, stretch: 4, fadeMs: 0, loopable: true },
  f: { anchor: '', trimDb: -60, stretch: 4, fadeMs: 0, loopable: true },
  v: { anchor: '', trimDb: -60, stretch: 4, fadeMs: 0, loopable: true },
  θ: { anchor: '', trimDb: -60, stretch: 4, fadeMs: 0, loopable: true },
  ð: { anchor: '', trimDb: -60, stretch: 4, fadeMs: 0, loopable: true },
  ʃ: { anchor: '', trimDb: -60, stretch: 4, fadeMs: 0, loopable: true },
  ʒ: { anchor: '', trimDb: -60, stretch: 4, fadeMs: 0, loopable: true },
  // Sonorants — schwa anchor, 2x stretch, natural release, non-looping
  m: {
    anchor: '@',
    trimDb: -40,
    stretch: 2,
    fadeMs: 20,
    loopable: false,
  },
  n: {
    anchor: '@',
    trimDb: -40,
    stretch: 2,
    fadeMs: 20,
    loopable: false,
  },
  ŋ: {
    anchor: '@',
    trimDb: -40,
    stretch: 2,
    fadeMs: 20,
    loopable: false,
  },
  l: {
    anchor: '@',
    trimDb: -40,
    stretch: 2,
    fadeMs: 20,
    loopable: false,
  },
  r: {
    anchor: '@',
    trimDb: -40,
    stretch: 2,
    fadeMs: 20,
    loopable: false,
  },
  // Sustainable short vowels — loopable so hover holds the vowel
  ɪ: {
    anchor: '',
    trimDb: -40,
    stretch: 2,
    fadeMs: 10,
    loopable: true,
  },
  æ: {
    anchor: '',
    trimDb: -40,
    stretch: 2,
    fadeMs: 10,
    loopable: true,
  },
};

const defaultAnchor = (ipa: string): '' | 'E' =>
  CONSONANTS.has(ipa) ? 'E' : '';

const configFor = (ipa: string): PhonemeConfig =>
  PHONEME_CONFIG[ipa] ?? {
    anchor: defaultAnchor(ipa),
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
  };

const buildKirshenbaumInput = (ipa: string): string => {
  const code = IPA_TO_KIRSH[ipa];
  if (!code) throw new Error(`No Kirshenbaum mapping for IPA "${ipa}"`);
  return `[[${code}${configFor(ipa).anchor}]]`;
};

const buildFilterChain = (cfg: PhonemeConfig): string | null => {
  const parts: string[] = [];
  if (cfg.trimDb !== null) {
    parts.push(
      `silenceremove=start_periods=1:start_threshold=${cfg.trimDb}dB:` +
        `stop_periods=-1:stop_threshold=${cfg.trimDb}dB`,
    );
  }
  if (cfg.stretch === 2) parts.push('atempo=0.5');
  if (cfg.stretch === 4) parts.push('atempo=0.5', 'atempo=0.5');
  if (cfg.fadeMs > 0) {
    const d = (cfg.fadeMs / 1000).toFixed(3);
    parts.push(
      `afade=t=in:st=0:d=${d}`,
      'areverse',
      `afade=t=in:st=0:d=${d}`,
      'areverse',
    );
  }
  return parts.length > 0 ? parts.join(',') : null;
};

const corpusPhonemes = (): string[] => {
  const seen = new Set<string>();
  for (const file of readdirSync(corpusDir).filter((f) =>
    f.endsWith('.json'),
  )) {
    const raw = readFileSync(path.join(corpusDir, file), 'utf8');
    const entries = JSON.parse(raw) as Array<{
      graphemes?: Array<{ p: string }>;
    }>;
    for (const entry of entries) {
      for (const g of entry.graphemes ?? []) {
        if (g.p) seen.add(g.p);
      }
    }
  }
  return [...seen].toSorted();
};

const probeDurationSec = (wav: string): number => {
  const out = execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=nk=1:nw=1',
      wav,
    ],
    { encoding: 'utf8' },
  );
  return Number(out.trim());
};

const synthesizePhoneme = (ipa: string, outWav: string): void => {
  const input = buildKirshenbaumInput(ipa);
  execFileSync('espeak-ng', [
    '-v',
    'en',
    '-s',
    '140',
    '-w',
    outWav,
    input,
  ]);
};

const main = (): void => {
  if (existsSync(tmpDir))
    rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  const phonemes = corpusPhonemes();
  const missing = phonemes.filter((p) => !IPA_TO_KIRSH[p]);
  if (missing.length > 0) {
    throw new Error(
      `Corpus uses IPA phonemes with no Kirshenbaum mapping: ${missing.join(', ')}`,
    );
  }

  const silenceWav = path.join(tmpDir, 'silence.wav');
  execFileSync('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `anullsrc=r=${SAMPLE_RATE}:cl=mono`,
    '-t',
    GAP_SEC.toString(),
    silenceWav,
  ]);

  interface SpriteEntry {
    start: number;
    duration: number;
    loopable?: boolean;
  }
  const sprite: Record<string, SpriteEntry> = {};
  const concatLines: string[] = [];
  let cursor = 0;

  for (const [i, ipa] of phonemes.entries()) {
    const safe = i.toString().padStart(3, '0');
    const rawWav = path.join(tmpDir, `raw-${safe}.wav`);
    const normWav = path.join(tmpDir, `norm-${safe}.wav`);
    synthesizePhoneme(ipa, rawWav);
    const cfg = configFor(ipa);
    const filter = buildFilterChain(cfg);
    const ffmpegArgs = [
      '-y',
      '-i',
      rawWav,
      '-ar',
      SAMPLE_RATE.toString(),
      '-ac',
      '1',
    ];
    if (filter !== null) ffmpegArgs.push('-af', filter);
    ffmpegArgs.push(normWav);
    execFileSync('ffmpeg', ffmpegArgs);
    const dur = probeDurationSec(normWav);
    sprite[ipa] = {
      start: Math.round(cursor * 1000),
      duration: Math.round(dur * 1000),
      ...(cfg.loopable ? { loopable: true } : {}),
    };
    concatLines.push(`file '${normWav}'`, `file '${silenceWav}'`);
    cursor += dur + GAP_SEC;
  }

  const concatList = path.join(tmpDir, 'concat.txt');
  writeFileSync(concatList, concatLines.join('\n'));

  const mp3Path = path.join(outDir, 'phonemes.mp3');
  execFileSync('ffmpeg', [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatList,
    '-codec:a',
    'libmp3lame',
    '-qscale:a',
    '6',
    mp3Path,
  ]);

  const jsonPath = path.join(outDir, 'phonemes.json');
  writeFileSync(jsonPath, JSON.stringify(sprite, null, 2) + '\n');

  rmSync(tmpDir, { recursive: true, force: true });

  const totalMs = Math.round(cursor * 1000);
  console.log(
    `Generated ${phonemes.length} phoneme clips → ${path.relative(repoRoot, mp3Path)} (${totalMs}ms)`,
  );
};

main();
