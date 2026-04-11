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
 * Fricatives get synthesised bare and looped tight: the consonant is
 * already a steady-state hiss, so removing the schwa anchor keeps the
 * sustain sounding like "sssss" instead of "sssuuu".
 */
const SUSTAINABLE_FRICATIVES = new Set<string>([
  'f',
  'v',
  's',
  'z',
  'θ',
  'ð',
  'ʃ',
  'ʒ',
]);

/**
 * Nasals + liquids render as a brief burst when bare (eSpeak only emits
 * ~27 ms of actual consonant for `[[n]]`), so 4x stretching sounds choppy.
 * Keeping the `[[X@]]` anchor plus a 2x atempo stretch gives a smooth
 * ~650 ms release that matches the natural pronunciation the user asked
 * for ("n was better before"). These are NOT marked loopable since the
 * schwa tail would chant on loop — one playback per hover is enough.
 */
const SUSTAINABLE_SONORANTS = new Set<string>([
  'm',
  'n',
  'ŋ',
  'l',
  'r',
]);

/**
 * Short vowels the user asked to sustain during hover-blend. They're
 * already long enough that 2x atempo gives a clearly held vowel; we
 * mark them loopable so a long hover holds the vowel indefinitely.
 */
const SUSTAINABLE_VOWELS = new Set<string>(['ɪ', 'æ']);

const buildKirshenbaumInput = (ipa: string): string => {
  const code = IPA_TO_KIRSH[ipa];
  if (!code) throw new Error(`No Kirshenbaum mapping for IPA "${ipa}"`);
  // Fricatives render cleanly on their own. Sonorants keep the legacy
  // schwa anchor because bare eSpeak output is too short to stretch.
  // Non-sustainable consonants — plosives, affricates, glides — use
  // `[[XE]]` (the /ɛ/ anchor) so chips say "teh"/"peh" instead of
  // "tuh"/"puh". Vowels and diphthongs always render alone.
  if (SUSTAINABLE_FRICATIVES.has(ipa)) return `[[${code}]]`;
  if (SUSTAINABLE_SONORANTS.has(ipa)) return `[[${code}@]]`;
  if (CONSONANTS.has(ipa)) return `[[${code}E]]`;
  return `[[${code}]]`;
};

const isLoopable = (ipa: string): boolean =>
  SUSTAINABLE_FRICATIVES.has(ipa) || SUSTAINABLE_VOWELS.has(ipa);

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

  // Fricatives: bare consonant + 4x atempo stretch + tight trim. The
  // −60 dB threshold catches low-energy voiced fricatives like [[v]]
  // that would be wiped out at −40 dB. 5 ms fades smooth the loop seam.
  const FRICATIVE_FILTER =
    'silenceremove=start_periods=1:start_threshold=-60dB:' +
    'stop_periods=-1:stop_threshold=-60dB,' +
    'atempo=0.5,atempo=0.5,' +
    'afade=t=in:st=0:d=0.005,' +
    'areverse,afade=t=in:st=0:d=0.005,areverse';

  // Sonorants (nasals + liquids): stretch 2x via atempo so the bursty
  // eSpeak rendering of `[[X@]]` produces a smooth ~650 ms release.
  // Keeps the schwa so the chip speaks the phoneme naturally — the
  // user explicitly preferred this over the tight bare-consonant loop.
  const SONORANT_FILTER =
    'silenceremove=start_periods=1:start_threshold=-40dB:' +
    'stop_periods=-1:stop_threshold=-40dB,' +
    'atempo=0.5,' +
    'afade=t=in:st=0:d=0.02,' +
    'areverse,afade=t=in:st=0:d=0.02,areverse';

  // Sustainable vowels: strip edge silence, stretch 2x so a single hover
  // pass holds the vowel for ~1.3 s, short fades for loop cleanup.
  const VOWEL_FILTER =
    'silenceremove=start_periods=1:start_threshold=-40dB:' +
    'stop_periods=-1:stop_threshold=-40dB,' +
    'atempo=0.5,' +
    'afade=t=in:st=0:d=0.01,' +
    'areverse,afade=t=in:st=0:d=0.01,areverse';

  const pickFilter = (ipa: string): string | null => {
    if (SUSTAINABLE_FRICATIVES.has(ipa)) return FRICATIVE_FILTER;
    if (SUSTAINABLE_SONORANTS.has(ipa)) return SONORANT_FILTER;
    if (SUSTAINABLE_VOWELS.has(ipa)) return VOWEL_FILTER;
    return null;
  };

  for (const [i, ipa] of phonemes.entries()) {
    const safe = i.toString().padStart(3, '0');
    const rawWav = path.join(tmpDir, `raw-${safe}.wav`);
    const normWav = path.join(tmpDir, `norm-${safe}.wav`);
    synthesizePhoneme(ipa, rawWav);
    const filter = pickFilter(ipa);
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
    const loopable = isLoopable(ipa);
    sprite[ipa] = {
      start: Math.round(cursor * 1000),
      duration: Math.round(dur * 1000),
      ...(loopable ? { loopable: true } : {}),
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
