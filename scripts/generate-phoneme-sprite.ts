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
 * sounds can be adjusted without touching the rest of the corpus. Values
 * are authored via the local tuner at `tools/phoneme-tuner/` on the
 * `tools/phoneme-tuner` branch — edit the tuned JSON there, then paste
 * into this map.
 *
 * - `anchor`: raw Kirshenbaum code appended inside `[[...]]`. Common
 *   choices: `''` bare, `'@'` schwa release, `'E'` `/ɛ/` for plosives,
 *   `'V'` `/ʌ/` for /h/, `'A:'`/`'i:'` long-vowel anchors for /r/ and /n/.
 * - `trimDb`: `silenceremove` threshold, or `null` to skip the trim pass.
 * - `stretch`: duration multiplier (fractional ok). 1 = no stretch;
 *   values > 2 chain `atempo=0.5` passes.
 * - `fadeMs`: symmetric `afade` in+out at the cropped edges. 0 keeps the
 *   loop seam gap-free (cost: click, usually masked by noise).
 * - `loopable`: marks the sprite entry so WebAudio wraps the segment on
 *   hover-sustain.
 * - `cropStartPct`/`cropEndPct`: percentage bounds of the stretched clip
 *   to keep (0 / 100 = no crop). Applied after stretch, before fade.
 * - `gainDb`: `volume` filter in dB, applied before silenceremove so the
 *   trim threshold is judged against the boosted signal.
 */
interface PhonemeConfig {
  readonly anchor: string;
  readonly trimDb: number | null;
  readonly stretch: number;
  readonly fadeMs: number;
  readonly loopable: boolean;
  readonly cropStartPct: number;
  readonly cropEndPct: number;
  readonly gainDb: number;
}

const PHONEME_CONFIG: Record<string, PhonemeConfig> = {
  p: {
    anchor: '',
    trimDb: -60,
    stretch: 1.5,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 90,
    gainDb: 13,
  },
  b: {
    anchor: '@',
    trimDb: -30,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 5,
    cropEndPct: 80,
    gainDb: -5,
  },
  t: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 12,
  },
  d: {
    anchor: '@',
    trimDb: -40,
    stretch: 1.8,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 2,
    cropEndPct: 80,
    gainDb: 0,
  },
  k: {
    anchor: '',
    trimDb: -80,
    stretch: 1.6,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 15,
  },
  g: {
    anchor: '@',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 5,
    cropEndPct: 100,
    gainDb: 0,
  },
  f: {
    anchor: '',
    trimDb: null,
    stretch: 1.5,
    fadeMs: 0,
    loopable: true,
    cropStartPct: 0,
    cropEndPct: 20,
    gainDb: 0,
  },
  v: {
    anchor: '@',
    trimDb: null,
    stretch: 1.5,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 60,
    gainDb: 0,
  },
  s: {
    anchor: '',
    trimDb: -60,
    stretch: 2,
    fadeMs: 10,
    loopable: true,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  z: {
    anchor: '',
    trimDb: null,
    stretch: 4,
    fadeMs: 5,
    loopable: true,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 4,
  },
  h: {
    anchor: 'V',
    trimDb: null,
    stretch: 4,
    fadeMs: 20,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 50,
    gainDb: 0,
  },
  θ: {
    anchor: '',
    trimDb: -60,
    stretch: 4,
    fadeMs: 0,
    loopable: true,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ð: {
    anchor: '',
    trimDb: -60,
    stretch: 4,
    fadeMs: 0,
    loopable: true,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ʃ: {
    anchor: '',
    trimDb: -60,
    stretch: 4,
    fadeMs: 0,
    loopable: true,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ʒ: {
    anchor: '',
    trimDb: -60,
    stretch: 4,
    fadeMs: 0,
    loopable: true,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  tʃ: {
    anchor: 'E',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  dʒ: {
    anchor: 'E',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  m: {
    anchor: '@',
    trimDb: -40,
    stretch: 2,
    fadeMs: 20,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  n: {
    anchor: 'i:',
    trimDb: null,
    stretch: 4,
    fadeMs: 20,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ŋ: {
    anchor: '@',
    trimDb: -40,
    stretch: 2,
    fadeMs: 20,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  l: {
    anchor: '@',
    trimDb: -40,
    stretch: 2,
    fadeMs: 20,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  r: {
    anchor: 'A:',
    trimDb: -40,
    stretch: 2,
    fadeMs: 20,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  w: {
    anchor: 'E',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  j: {
    anchor: 'E',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ks: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  kw: {
    anchor: '',
    trimDb: -40,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  juː: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  e: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  æ: {
    anchor: '',
    trimDb: -40,
    stretch: 2,
    fadeMs: 10,
    loopable: true,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ɒ: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ʌ: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ʊ: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ɪ: {
    anchor: '',
    trimDb: -40,
    stretch: 2,
    fadeMs: 50,
    loopable: true,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ə: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  iː: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  uː: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ɑː: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ɔː: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ɜː: {
    anchor: '',
    trimDb: null,
    stretch: 2,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  aɪ: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  aʊ: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  eɪ: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  oʊ: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ɔɪ: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  eə: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ɛə: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  },
  ɪə: {
    anchor: '',
    trimDb: null,
    stretch: 1,
    fadeMs: 0,
    loopable: false,
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
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
    cropStartPct: 0,
    cropEndPct: 100,
    gainDb: 0,
  };

const buildKirshenbaumInput = (ipa: string): string => {
  const code = IPA_TO_KIRSH[ipa];
  if (!code) throw new Error(`No Kirshenbaum mapping for IPA "${ipa}"`);
  return `[[${code}${configFor(ipa).anchor}]]`;
};

const buildStretchChain = (cfg: PhonemeConfig): string => {
  const parts: string[] = [];
  if (cfg.gainDb !== 0) parts.push(`volume=${cfg.gainDb}dB`);
  if (cfg.trimDb !== null) {
    parts.push(
      `silenceremove=start_periods=1:start_threshold=${cfg.trimDb}dB:` +
        `stop_periods=-1:stop_threshold=${cfg.trimDb}dB`,
    );
  }
  if (cfg.stretch > 0 && Math.abs(cfg.stretch - 1) > 1e-6) {
    let tempo = 1 / cfg.stretch;
    while (tempo < 0.5 - 1e-9) {
      parts.push('atempo=0.5');
      tempo /= 0.5;
    }
    while (tempo > 100 + 1e-9) {
      parts.push('atempo=100.0');
      tempo /= 100;
    }
    parts.push(`atempo=${tempo.toFixed(6)}`);
  }
  return parts.join(',');
};

const buildCropFadeChain = (
  cfg: PhonemeConfig,
  stage1Dur: number,
): string => {
  const parts: string[] = [];
  const startPct = Math.max(0, Math.min(100, cfg.cropStartPct));
  const endPct = Math.max(startPct, Math.min(100, cfg.cropEndPct));
  const startS = (stage1Dur * startPct) / 100;
  const endS = (stage1Dur * endPct) / 100;
  let croppedDur = Math.max(0, endS - startS);
  if ((startPct > 0 || endPct < 100) && croppedDur > 0) {
    parts.push(
      `atrim=start=${startS.toFixed(6)}:end=${endS.toFixed(6)}`,
      'asetpts=PTS-STARTPTS',
    );
  } else if (croppedDur === 0) {
    croppedDur = stage1Dur;
  }
  if (cfg.fadeMs > 0 && croppedDur > 0) {
    const d = cfg.fadeMs / 1000;
    if (d * 2 < croppedDur) {
      parts.push(
        `afade=t=in:st=0:d=${d.toFixed(3)}`,
        `afade=t=out:st=${(croppedDur - d).toFixed(6)}:d=${d.toFixed(3)}`,
      );
    }
  }
  return parts.join(',');
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
    const stage1Wav = path.join(tmpDir, `stage1-${safe}.wav`);
    const normWav = path.join(tmpDir, `norm-${safe}.wav`);
    synthesizePhoneme(ipa, rawWav);
    const cfg = configFor(ipa);

    const stage1Args = [
      '-y',
      '-i',
      rawWav,
      '-ar',
      SAMPLE_RATE.toString(),
      '-ac',
      '1',
    ];
    const chain1 = buildStretchChain(cfg);
    if (chain1.length > 0) stage1Args.push('-af', chain1);
    stage1Args.push(stage1Wav);
    execFileSync('ffmpeg', stage1Args);

    const stage1Dur = probeDurationSec(stage1Wav);
    const stage2Args = ['-y', '-i', stage1Wav];
    const chain2 = buildCropFadeChain(cfg, stage1Dur);
    if (chain2.length > 0) stage2Args.push('-af', chain2);
    stage2Args.push(normWav);
    execFileSync('ffmpeg', stage2Args);

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
