# AudioSprite: Hover sustain text to speech

## 1. Create a git worktree branch for docs

cd /Users/leocaseiro/Sites/base-skill
git worktree add ../base-skill-docs docs/phoneme-player 2>/dev/null || git worktree add -b docs/phoneme-player ../base-skill-docs

## 2. Save the markdown file into it

cat > ../base-skill-docs/phoneme-player.md << 'MARKDOWN'

## Phoneme Audio Sprite — Setup & Architecture

### Overview

A client-side phonics learning tool where users hover over letter buttons to hear sustained phoneme sounds. Sliding across buttons blends sounds naturally, mimicking how words are sounded out.

### How it works

- A single **audio sprite** (one MP3/WebM file) holds all phonemes sequenced end-to-end
- A **JSON manifest** maps each phoneme label to its `start` and `duration` in the sprite
- The **Web Audio API** seeks instantly to any phoneme slice and loops the sustain region while the user hovers

### Sustain loop strategy

Each clip is divided into 3 zones:

| Zone    | % of clip  | Behaviour                           |
| ------- | ---------- | ----------------------------------- |
| Attack  | first 30%  | plays once (burst/onset)            |
| Sustain | middle 40% | **loops seamlessly** while hovering |
| Release | last 30%   | plays on mouse leave                |

This gives natural sustain on sonorants (`m`, `n`, `l`) and vowels, while plosives (`p`, `t`, `k`) just give a short burst — phonetically correct.

### File structure

```
public/audio/
phonemes.mp3        ← audio sprite (primary)
phonemes.webm       ← audio sprite (fallback)
phonemes.json       ← timestamp manifest
parts/              ← individual WAV files (intermediate, can delete)
```

---

### Step 1 — Prerequisites

```bash
brew install espeak-ng ffmpeg
```

### Step 2 — Generate the audio sprite

Save `generate-phoneme-sprite.sh` at the project root and run:

```bash
bash generate-phoneme-sprite.sh
```

The script will:

1. Use eSpeak-NG to render each phoneme to a WAV file using `[[phoneme]]` notation
2. Concatenate all WAVs using ffmpeg
3. Export as `.mp3` and `.webm` for browser compatibility
4. Use a Node.js snippet to measure each clip's duration and write `phonemes.json`

### Step 3 — Use the component

```tsx
import PhonemePlayer from '@/components/PhonemePlayer';

export default function Page() {
  return <PhonemePlayer />;
}
```

### Phoneme manifest format

```json
{
  "a": { "start": 0.0, "duration": 0.64 },
  "e": { "start": 0.64, "duration": 0.61 },
  "n": { "start": 1.25, "duration": 0.72 },
  "sh": { "start": 1.97, "duration": 0.58 }
}
```

### Phoneme reference (eSpeak-NG notation)

| Label | eSpeak string | Type      |
| ----- | ------------- | --------- |
| a     | `[[a:]]`      | vowel     |
| e     | `[[e:]]`      | vowel     |
| i     | `[[i:]]`      | vowel     |
| o     | `[[o:]]`      | vowel     |
| u     | `[[u:]]`      | vowel     |
| m     | `[[m:]]`      | sonorant  |
| n     | `[[n:]]`      | sonorant  |
| l     | `[[l:]]`      | sonorant  |
| r     | `[[r:]]`      | sonorant  |
| s     | `[[s:]]`      | fricative |
| f     | `[[f:]]`      | fricative |
| sh    | `[[S:]]`      | fricative |
| th    | `[[T:]]`      | fricative |
| ch    | `[[tS]]`      | affricate |
| b     | `[[b]]`       | plosive   |
| d     | `[[d]]`       | plosive   |
| g     | `[[g]]`       | plosive   |
| k     | `[[k]]`       | plosive   |
| p     | `[[p]]`       | plosive   |
| t     | `[[t]]`       | plosive   |

### Component architecture

```
PhonemePlayer          (page shell, loads audio)
└── Word             (word label + row of buttons)
└── PhonemeButton  (individual hover button)
PhonemeAudioEngine     (singleton, Web Audio API wrapper)
usePhonemeAudio        (hook: loads manifest + sprite, exposes play/stop)
```

### Tuning tips

- If a phoneme sounds too short, increase the repeat count in the eSpeak phoneme string: `[[nnnn]]`
- If the sustain loop has a click/pop, nudge `sustainStart`/`sustainEnd` by ±5ms in `PhonemeAudioEngine`
- Vowels and sonorants work best with `duration >= 0.6s` in the sprite
- Add more words by extending the `DEMO_WORDS` array in `PhonemePlayer.tsx`

### Dependencies

- `espeak-ng` — speech synthesis (generation only, not runtime)
- `ffmpeg` — audio concatenation and format conversion (generation only)
- Web Audio API — built into all modern browsers, no npm package needed
  MARKDOWN
