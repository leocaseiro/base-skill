# Group A+B: Sound Engine + TTS Wiring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix voice loading race condition; wire speech rate/volume/language from settings into TTS; add drag-start TTS; add mp3 sound effects for correct/wrong tile, round-complete, game-complete; auto-speak round prompt; hide AudioButton when TTS disabled.

**Architecture:** Enhance `SpeechOutput.ts` to accept options and defer when voices are unloaded. `AudioFeedback.ts` (new) manages mp3 playback. `useGameTTS` reads from `useSettings()` and passes options to `speak()`. `useRoundTTS` (new) auto-speaks on round change. `useGameSounds` (new) plays mp3s on phase change. `useTileEvaluation` plays correct/wrong on placement. Drag `onDragStart` callbacks trigger `speakTile`.

**Tech Stack:** Web Speech API, HTML `Audio`, `@atlaskit/pragmatic-drag-and-drop`, React 19, Vitest, react-i18next

**Worktree:** `./worktrees/feat-word-spell-number-match`

**Sound files to copy from Downloads:**

- Wrong: `/Users/leocaseiro/Music/Downloads/wrong-button-sound-2_NWM.mp3` → `public/sounds/wrong.mp3`
- Correct: `/Users/leocaseiro/Music/Downloads/audioblocks-positive-correct-answer_HYHfgGMU0wU_NWM.mp3` → `public/sounds/correct.mp3`
- Round complete: `/Users/leocaseiro/Music/Downloads/Correct Answer #3 Sound Effect [0ZQ-Lk--ILE].mp3` → `public/sounds/round-complete.mp3`
- Game complete: `/Users/leocaseiro/Music/Downloads/freesound_community-level-win-6416.mp3` → `public/sounds/game-complete.mp3`

---

## File Map

| File                                                         | Action        | Responsibility                                                                       |
| ------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------ |
| `public/sounds/wrong.mp3`                                    | Create (copy) | Wrong tile sound                                                                     |
| `public/sounds/correct.mp3`                                  | Create (copy) | Correct tile sound                                                                   |
| `public/sounds/round-complete.mp3`                           | Create (copy) | Round applause                                                                       |
| `public/sounds/game-complete.mp3`                            | Create (copy) | Game end tune                                                                        |
| `src/lib/speech/SpeechOutput.ts`                             | Modify        | Add `SpeakOptions`; fix voice loading race via voiceschanged; apply rate/volume/lang |
| `src/lib/speech/SpeechOutput.test.ts`                        | Modify        | Add tests for options and deferred voice loading                                     |
| `src/lib/audio/AudioFeedback.ts`                             | Create        | `playSound(key, volume)` — HTMLAudio mp3 player                                      |
| `src/lib/audio/AudioFeedback.test.ts`                        | Create        | Mock Audio constructor, verify correct file played                                   |
| `src/components/answer-game/useGameTTS.ts`                   | Modify        | Read `useSettings()`, pass rate/volume/voice/lang to `speak()`                       |
| `src/components/answer-game/useGameTTS.test.tsx`             | Modify        | Verify options forwarded; no-op when disabled                                        |
| `src/components/answer-game/useRoundTTS.ts`                  | Create        | Auto-speaks prompt when `roundIndex` changes and `ttsEnabled`                        |
| `src/components/answer-game/useRoundTTS.test.tsx`            | Create        | Fires speak on mount + roundIndex change; no-op when disabled                        |
| `src/components/answer-game/useGameSounds.ts`                | Create        | Plays mp3 on `round-complete` / `game-over` phase transitions                        |
| `src/components/answer-game/useGameSounds.test.tsx`          | Create        | Verifies correct sound per phase transition                                          |
| `src/components/answer-game/useTileEvaluation.ts`            | Modify        | Call `playSound('correct'/'wrong')` after dispatch                                   |
| `src/components/answer-game/useTileEvaluation.test.tsx`      | Modify        | Add assertions for playSound calls                                                   |
| `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`     | Modify        | Add `onDragStart: () => speakTileRef.current(label)` to draggable                    |
| `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx` | Modify        | Same drag-start TTS                                                                  |
| `src/games/word-spell/WordSpell/WordSpell.tsx`               | Modify        | Add `useRoundTTS` + `useGameSounds` inside `WordSpellSession`                        |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`         | Modify        | Same hooks in `NumberMatchSession`                                                   |
| `src/components/questions/AudioButton/AudioButton.tsx`       | Modify        | Return `null` when `!config.ttsEnabled`                                              |

---

## Task 1: Copy sound files to public/sounds/

**Files:**

- Create: `public/sounds/wrong.mp3`
- Create: `public/sounds/correct.mp3`
- Create: `public/sounds/round-complete.mp3`
- Create: `public/sounds/game-complete.mp3`

- [ ] **Step 1: Copy the files**

  ```bash
  mkdir -p public/sounds
  cp "/Users/leocaseiro/Music/Downloads/wrong-button-sound-2_NWM.mp3" public/sounds/wrong.mp3
  cp "/Users/leocaseiro/Music/Downloads/audioblocks-positive-correct-answer_HYHfgGMU0wU_NWM.mp3" public/sounds/correct.mp3
  cp "/Users/leocaseiro/Music/Downloads/Correct Answer #3 Sound Effect [0ZQ-Lk--ILE].mp3" public/sounds/round-complete.mp3
  cp "/Users/leocaseiro/Music/Downloads/freesound_community-level-win-6416.mp3" public/sounds/game-complete.mp3
  ls -lh public/sounds/
  ```

  Expected: 4 files listed.

- [ ] **Step 2: Commit**

  ```bash
  git add public/sounds/
  git commit -m "chore: add game sound effect assets to public/sounds"
  ```

---

## Task 2: Create AudioFeedback service

**Files:**

- Create: `src/lib/audio/AudioFeedback.ts`
- Create: `src/lib/audio/AudioFeedback.test.ts`

- [ ] **Step 1: Write the failing test**

  Create `src/lib/audio/AudioFeedback.test.ts`:

  ```ts
  import { afterEach, describe, expect, it, vi } from 'vitest';

  describe('AudioFeedback', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('creates an Audio element with the correct src for "correct"', async () => {
      const playSpy = vi.fn().mockResolvedValue(undefined);
      const AudioMock = vi.fn().mockImplementation((src: string) => ({
        src,
        volume: 1,
        play: playSpy,
        pause: vi.fn(),
      }));
      vi.stubGlobal('Audio', AudioMock);

      const { playSound } = await import('./AudioFeedback');
      playSound('correct');

      expect(AudioMock).toHaveBeenCalledWith('/sounds/correct.mp3');
      expect(playSpy).toHaveBeenCalled();
    });

    it('creates an Audio element for "wrong"', async () => {
      const playSpy = vi.fn().mockResolvedValue(undefined);
      const AudioMock = vi.fn().mockImplementation((src: string) => ({
        src,
        volume: 1,
        play: playSpy,
        pause: vi.fn(),
      }));
      vi.stubGlobal('Audio', AudioMock);

      const { playSound } = await import('./AudioFeedback');
      playSound('wrong');

      expect(AudioMock).toHaveBeenCalledWith('/sounds/wrong.mp3');
    });

    it('sets volume on the audio element', async () => {
      let capturedVolume = 1;
      const AudioMock = vi.fn().mockImplementation(() => ({
        set volume(v: number) {
          capturedVolume = v;
        },
        get volume() {
          return capturedVolume;
        },
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
      }));
      vi.stubGlobal('Audio', AudioMock);

      const { playSound } = await import('./AudioFeedback');
      playSound('correct', 0.5);

      expect(capturedVolume).toBe(0.5);
    });
  });
  ```

- [ ] **Step 2: Run test to confirm it fails**

  ```bash
  yarn test src/lib/audio/AudioFeedback.test.ts 2>&1 | tail -10
  ```

  Expected: FAIL — `Cannot find module './AudioFeedback'`

- [ ] **Step 3: Create `src/lib/audio/AudioFeedback.ts`**

  ```ts
  type SoundKey =
    | 'correct'
    | 'wrong'
    | 'round-complete'
    | 'game-complete';

  const SOUND_PATHS: Record<SoundKey, string> = {
    correct: '/sounds/correct.mp3',
    wrong: '/sounds/wrong.mp3',
    'round-complete': '/sounds/round-complete.mp3',
    'game-complete': '/sounds/game-complete.mp3',
  };

  let currentAudio: HTMLAudioElement | null = null;

  export function playSound(key: SoundKey, volume = 0.8): void {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    const audio = new Audio(SOUND_PATHS[key]);
    audio.volume = volume;
    currentAudio = audio;
    void audio.play().catch(() => {
      // Ignore autoplay policy errors — sound is best-effort
    });
  }
  ```

- [ ] **Step 4: Run tests**

  ```bash
  yarn test src/lib/audio/AudioFeedback.test.ts 2>&1 | tail -10
  ```

  Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/audio/AudioFeedback.ts src/lib/audio/AudioFeedback.test.ts
  git commit -m "feat(audio): add AudioFeedback service for mp3 sound effects"
  ```

---

## Task 3: Fix SpeechOutput voice loading race + add options

**Files:**

- Modify: `src/lib/speech/SpeechOutput.ts`
- Modify: `src/lib/speech/SpeechOutput.test.ts`

- [ ] **Step 1: Write failing tests for deferred voice + options**

  Open `src/lib/speech/SpeechOutput.test.ts` and add:

  ```ts
  describe('speak with options', () => {
    it('applies rate and volume to utterance', () => {
      const mockUtterance = {
        rate: 1,
        volume: 1,
        lang: '',
        voice: null,
      };
      const UtteranceMock = vi.fn().mockReturnValue(mockUtterance);
      vi.stubGlobal('SpeechSynthesisUtterance', UtteranceMock);

      const mockVoice = { name: 'Daniel' };
      const synthMock = {
        cancel: vi.fn(),
        speak: vi.fn(),
        getVoices: vi.fn().mockReturnValue([mockVoice]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      vi.stubGlobal('speechSynthesis', synthMock);

      speak('hello', { rate: 1.5, volume: 0.6, voiceName: 'Daniel' });

      expect(mockUtterance.rate).toBe(1.5);
      expect(mockUtterance.volume).toBe(0.6);
    });

    it('defers speak via voiceschanged when voices not yet loaded', () => {
      const mockUtterance = {
        rate: 1,
        volume: 1,
        lang: '',
        voice: null,
      };
      const UtteranceMock = vi.fn().mockReturnValue(mockUtterance);
      vi.stubGlobal('SpeechSynthesisUtterance', UtteranceMock);

      let voicesChangedHandler: (() => void) | null = null;
      const synthMock = {
        cancel: vi.fn(),
        speak: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]), // empty on first call
        addEventListener: vi
          .fn()
          .mockImplementation((event, handler) => {
            if (event === 'voiceschanged')
              voicesChangedHandler = handler;
          }),
        removeEventListener: vi.fn(),
      };
      vi.stubGlobal('speechSynthesis', synthMock);

      speak('hello', { voiceName: 'Daniel' });

      // Speak NOT called yet
      expect(synthMock.speak).not.toHaveBeenCalled();

      // Voices load
      synthMock.getVoices.mockReturnValue([{ name: 'Daniel' }]);
      voicesChangedHandler?.();

      expect(synthMock.speak).toHaveBeenCalledOnce();
    });

    it('sets lang on utterance', () => {
      const mockUtterance = {
        rate: 1,
        volume: 1,
        lang: '',
        voice: null,
      };
      vi.stubGlobal(
        'SpeechSynthesisUtterance',
        vi.fn().mockReturnValue(mockUtterance),
      );
      vi.stubGlobal('speechSynthesis', {
        cancel: vi.fn(),
        speak: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      speak('hello', { lang: 'pt-BR' });

      expect(mockUtterance.lang).toBe('pt-BR');
    });
  });
  ```

- [ ] **Step 2: Run to confirm failures**

  ```bash
  yarn test src/lib/speech/SpeechOutput.test.ts 2>&1 | tail -15
  ```

  Expected: new tests FAIL.

- [ ] **Step 3: Rewrite `src/lib/speech/SpeechOutput.ts`**

  ```ts
  export interface SpeakOptions {
    rate?: number;
    volume?: number;
    voiceName?: string;
    lang?: string;
  }

  function doSpeak(
    text: string,
    options: SpeakOptions,
    synth: SpeechSynthesis,
  ): void {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = options.rate ?? 1;
    u.volume = options.volume ?? 1;
    if (options.lang) u.lang = options.lang;

    const voiceName = options.voiceName ?? 'Daniel';
    const voice = synth.getVoices().find((v) => v.name === voiceName);
    if (voice) u.voice = voice;

    synth.speak(u);
  }

  export function speak(
    text: string,
    options: SpeakOptions = {},
  ): void {
    const synth = (
      globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
    ).speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const voices = synth.getVoices();
    if (voices.length > 0) {
      doSpeak(text, options, synth);
      return;
    }

    // Voices not yet loaded — defer until voiceschanged fires
    const handler = () => {
      synth.removeEventListener('voiceschanged', handler);
      doSpeak(text, options, synth);
    };
    synth.addEventListener('voiceschanged', handler);
  }

  export function cancelSpeech(): void {
    const synth = (
      globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
    ).speechSynthesis;
    if (!synth) return;
    synth.cancel();
  }

  export function isSpeechOutputAvailable(): boolean {
    return !!(
      globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
    ).speechSynthesis;
  }
  ```

- [ ] **Step 4: Run all SpeechOutput tests**

  ```bash
  yarn test src/lib/speech/SpeechOutput.test.ts 2>&1 | tail -15
  ```

  Expected: all tests PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/speech/SpeechOutput.ts src/lib/speech/SpeechOutput.test.ts
  git commit -m "fix(tts): fix voice loading race; add rate/volume/lang options to speak()"
  ```

---

## Task 4: Wire settings into useGameTTS + language from i18n

**Files:**

- Modify: `src/components/answer-game/useGameTTS.ts`
- Modify: `src/components/answer-game/useGameTTS.test.tsx`

- [ ] **Step 1: Write failing test**

  In `src/components/answer-game/useGameTTS.test.tsx`, add:

  ```tsx
  it('passes speechRate and volume from settings to speak()', () => {
    const speakMock = vi.fn();
    vi.mock('@/lib/speech/SpeechOutput', () => ({ speak: speakMock }));
    // Mock useSettings to return custom rate/volume
    vi.mock('@/db/hooks/useSettings', () => ({
      useSettings: () => ({
        settings: {
          speechRate: 1.5,
          volume: 0.6,
          preferredVoiceURI: 'Samantha',
          ttsEnabled: true,
        },
        update: vi.fn(),
      }),
    }));

    // ... render hook and call speakTile('A')
    // expect speakMock called with ('A', { rate: 1.5, volume: 0.6, voiceName: 'Samantha' })
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/components/answer-game/useGameTTS.test.tsx 2>&1 | tail -10
  ```

- [ ] **Step 2: Update `useGameTTS.ts`**

  ```ts
  import { useCallback } from 'react';
  import { useTranslation } from 'react-i18next';
  import { useAnswerGameContext } from './useAnswerGameContext';
  import { useSettings } from '@/db/hooks/useSettings';
  import { speak } from '@/lib/speech/SpeechOutput';

  export interface GameTTS {
    speakTile: (label: string) => void;
    speakPrompt: (text: string) => void;
  }

  export function useGameTTS(): GameTTS {
    const { config } = useAnswerGameContext();
    const { settings } = useSettings();
    const { i18n } = useTranslation();

    const speakTile = useCallback(
      (label: string) => {
        if (!config.ttsEnabled) return;
        speak(label, {
          rate: settings.speechRate ?? 1,
          volume: settings.volume ?? 0.8,
          voiceName: settings.preferredVoiceURI ?? 'Daniel',
          lang: i18n.language,
        });
      },
      [
        config.ttsEnabled,
        settings.speechRate,
        settings.volume,
        settings.preferredVoiceURI,
        i18n.language,
      ],
    );

    const speakPrompt = useCallback(
      (text: string) => {
        if (!config.ttsEnabled) return;
        speak(text, {
          rate: settings.speechRate ?? 1,
          volume: settings.volume ?? 0.8,
          voiceName: settings.preferredVoiceURI ?? 'Daniel',
          lang: i18n.language,
        });
      },
      [
        config.ttsEnabled,
        settings.speechRate,
        settings.volume,
        settings.preferredVoiceURI,
        i18n.language,
      ],
    );

    return { speakTile, speakPrompt };
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/useGameTTS.test.tsx 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/answer-game/useGameTTS.ts src/components/answer-game/useGameTTS.test.tsx
  git commit -m "fix(tts): wire speechRate/volume/voice/lang from settings into useGameTTS"
  ```

---

## Task 5: Add drag-start TTS to tile banks

**Files:**

- Modify: `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`
- Modify: `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`

- [ ] **Step 1: Update `LetterTileBank.tsx` to speak on drag start**

  In `src/games/word-spell/LetterTileBank/LetterTileBank.tsx`, inside `LetterTile`, add a ref to keep `speakTile` stable across re-renders, and wire `onDragStart`:

  ```tsx
  import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
  import { useEffect, useRef } from 'react';
  import type { TileItem } from '@/components/answer-game/types';
  import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
  import { useAutoNextSlot } from '@/components/answer-game/useAutoNextSlot';
  import { useGameTTS } from '@/components/answer-game/useGameTTS';

  const LetterTile = ({ tile }: { tile: TileItem }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const { placeInNextSlot } = useAutoNextSlot();
    const { speakTile } = useGameTTS();
    const speakTileRef = useRef(speakTile);

    useEffect(() => {
      speakTileRef.current = speakTile;
    }, [speakTile]);

    useEffect(() => {
      const element = ref.current;
      if (!element) return;
      return draggable({
        element,
        getInitialData: () => ({ tileId: tile.id }),
        onDragStart: () => speakTileRef.current(tile.label),
      });
    }, [tile.id, tile.label]);

    const handleClick = () => {
      speakTile(tile.label);
      placeInNextSlot(tile.id);
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={`Letter ${tile.label}`}
        className="flex size-14 cursor-grab items-center justify-center rounded-xl bg-card text-2xl font-bold shadow-md transition-transform active:scale-95 active:cursor-grabbing"
        onClick={handleClick}
      >
        {tile.label}
      </button>
    );
  };

  export const LetterTileBank = () => {
    const { allTiles, bankTileIds } = useAnswerGameContext();
    const bankTiles = allTiles.filter((t) =>
      bankTileIds.includes(t.id),
    );

    return (
      <div className="flex flex-wrap justify-center gap-3">
        {bankTiles.map((tile) => (
          <LetterTile key={tile.id} tile={tile} />
        ))}
      </div>
    );
  };
  ```

- [ ] **Step 2: Apply same pattern to `NumeralTileBank.tsx`**

  Open `src/games/number-match/NumeralTileBank/NumeralTileBank.tsx`. Find the `draggable` call inside the tile component and add:

  ```tsx
  const speakTileRef = useRef(speakTile);
  useEffect(() => {
    speakTileRef.current = speakTile;
  }, [speakTile]);

  // In the draggable effect:
  return draggable({
    element,
    getInitialData: () => ({ tileId: tile.id }),
    onDragStart: () => speakTileRef.current(tile.label),
  });
  ```

- [ ] **Step 3: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/games/word-spell/LetterTileBank/LetterTileBank.tsx \
    src/games/number-match/NumeralTileBank/NumeralTileBank.tsx
  git commit -m "feat(tts): speak tile label on drag start in tile banks"
  ```

---

## Task 6: Wire sound effects into useTileEvaluation

**Files:**

- Modify: `src/components/answer-game/useTileEvaluation.ts`
- Modify: `src/components/answer-game/useTileEvaluation.test.tsx`

- [ ] **Step 1: Write failing test**

  In `src/components/answer-game/useTileEvaluation.test.tsx`, add a test that asserts `playSound` is called with `'correct'` / `'wrong'`:

  ```tsx
  it('plays correct sound when tile is correct', async () => {
    const playSoundMock = vi.fn();
    vi.mock('@/lib/audio/AudioFeedback', () => ({
      playSound: playSoundMock,
    }));
    // ... render with a correct tile placement
    // expect playSoundMock to have been called with 'correct'
  });
  ```

  Run to confirm FAIL.

  ```bash
  yarn test src/components/answer-game/useTileEvaluation.test.tsx 2>&1 | tail -10
  ```

- [ ] **Step 2: Update `useTileEvaluation.ts`**

  Add import and call `playSound` after evaluating correctness:

  ```ts
  import { useCallback, useEffect, useRef } from 'react';
  import { useAnswerGameContext } from './useAnswerGameContext';
  import { useAnswerGameDispatch } from './useAnswerGameDispatch';
  import { getGameEventBus } from '@/lib/game-event-bus';
  import { playSound } from '@/lib/audio/AudioFeedback';

  // Inside placeTile, after the correct check and before dispatch:
  const placeTile = useCallback(
    (tileId: string, zoneIndex: number) => {
      clearEjectionTimer();

      const tile = state.allTiles.find((t) => t.id === tileId);
      const zone = state.zones[zoneIndex];
      if (!tile || !zone) return;

      const correct = tile.value === zone.expectedValue;
      dispatch({ type: 'PLACE_TILE', tileId, zoneIndex });

      playSound(
        correct ? 'correct' : 'wrong',
        state.config.volume ?? 0.8,
      );

      getGameEventBus().emit({
        type: 'game:evaluate',
        gameId: state.config.gameId,
        sessionId: '',
        profileId: '',
        timestamp: Date.now(),
        roundIndex: state.roundIndex,
        answer: tileId,
        correct,
        nearMiss: false,
      });

      if (
        !correct &&
        state.config.wrongTileBehavior === 'lock-auto-eject'
      ) {
        ejectionTimerRef.current = setTimeout(() => {
          dispatch({ type: 'EJECT_TILE', zoneIndex });
          ejectionTimerRef.current = null;
        }, AUTO_EJECT_DELAY_MS);
      }
    },
    [state, dispatch, clearEjectionTimer],
  );
  ```

  Note: `state.config.volume` doesn't exist on `AnswerGameConfig`. Use a fixed `0.8` default instead:

  ```ts
  playSound(correct ? 'correct' : 'wrong', 0.8);
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/useTileEvaluation.test.tsx 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/answer-game/useTileEvaluation.ts \
    src/components/answer-game/useTileEvaluation.test.tsx
  git commit -m "feat(audio): play correct/wrong sound on tile placement"
  ```

---

## Task 7: Create useGameSounds hook (round + game-complete mp3s)

**Files:**

- Create: `src/components/answer-game/useGameSounds.ts`
- Create: `src/components/answer-game/useGameSounds.test.tsx`
- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`

- [ ] **Step 1: Write failing test**

  Create `src/components/answer-game/useGameSounds.test.tsx`:

  ```tsx
  import { renderHook } from '@testing-library/react';
  import { describe, expect, it, vi } from 'vitest';

  vi.mock('@/lib/audio/AudioFeedback', () => ({ playSound: vi.fn() }));

  describe('useGameSounds', () => {
    it('plays round-complete sound when phase becomes round-complete', async () => {
      const { playSound } = await import('@/lib/audio/AudioFeedback');
      // render hook with mock context providing phase = 'round-complete'
      // assert playSound called with 'round-complete'
    });

    it('plays game-complete sound when phase becomes game-over', async () => {
      const { playSound } = await import('@/lib/audio/AudioFeedback');
      // render hook with mock context providing phase = 'game-over'
      // assert playSound called with 'game-complete'
    });

    it('does not play sound on same phase value', async () => {
      const { playSound } = await import('@/lib/audio/AudioFeedback');
      // render hook, re-render with same phase = 'playing'
      // assert playSound NOT called
    });
  });
  ```

  Run to confirm FAIL:

  ```bash
  yarn test src/components/answer-game/useGameSounds.test.tsx 2>&1 | tail -10
  ```

- [ ] **Step 2: Create `src/components/answer-game/useGameSounds.ts`**

  ```ts
  import { useEffect, useRef } from 'react';
  import { useAnswerGameContext } from './useAnswerGameContext';
  import type { AnswerGamePhase } from './types';
  import { playSound } from '@/lib/audio/AudioFeedback';

  export function useGameSounds(): void {
    const { phase } = useAnswerGameContext();
    const prevPhaseRef = useRef<AnswerGamePhase>(phase);

    useEffect(() => {
      const prev = prevPhaseRef.current;
      prevPhaseRef.current = phase;

      if (phase === prev) return;

      if (phase === 'round-complete') {
        playSound('round-complete');
      } else if (phase === 'game-over') {
        playSound('game-complete');
      }
    }, [phase]);
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/useGameSounds.test.tsx 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 4: Add `useGameSounds` to `WordSpellSession`**

  In `src/games/word-spell/WordSpell/WordSpell.tsx`, inside `WordSpellSession`:

  ```tsx
  import { useGameSounds } from '@/components/answer-game/useGameSounds';

  const WordSpellSession = (...) => {
    // ... existing hooks
    useGameSounds();
    // ...
  };
  ```

- [ ] **Step 5: Add `useGameSounds` to `NumberMatchSession`**

  Same pattern in `src/games/number-match/NumberMatch/NumberMatch.tsx`.

- [ ] **Step 6: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/answer-game/useGameSounds.ts \
    src/components/answer-game/useGameSounds.test.tsx \
    src/games/word-spell/WordSpell/WordSpell.tsx \
    src/games/number-match/NumberMatch/NumberMatch.tsx
  git commit -m "feat(audio): play round-complete and game-complete sounds via useGameSounds"
  ```

---

## Task 8: Create useRoundTTS hook (auto-speak prompt)

**Files:**

- Create: `src/components/answer-game/useRoundTTS.ts`
- Create: `src/components/answer-game/useRoundTTS.test.tsx`
- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`

- [ ] **Step 1: Write failing test**

  Create `src/components/answer-game/useRoundTTS.test.tsx`:

  ```tsx
  import { renderHook } from '@testing-library/react';
  import { describe, expect, it, vi } from 'vitest';

  describe('useRoundTTS', () => {
    it('calls speakPrompt with the prompt on mount', () => {
      const speakPromptMock = vi.fn();
      vi.mock('./useGameTTS', () => ({
        useGameTTS: () => ({
          speakPrompt: speakPromptMock,
          speakTile: vi.fn(),
        }),
      }));

      // render useRoundTTS('cat') with a context where ttsEnabled = true, roundIndex = 0
      // expect speakPromptMock called with 'cat'
    });

    it('calls speakPrompt again when roundIndex changes', () => {
      const speakPromptMock = vi.fn();
      vi.mock('./useGameTTS', () => ({
        useGameTTS: () => ({
          speakPrompt: speakPromptMock,
          speakTile: vi.fn(),
        }),
      }));

      // render, re-render with new roundIndex
      // expect speakPromptMock called twice
    });

    it('does not call speakPrompt when ttsEnabled is false', () => {
      const speakPromptMock = vi.fn();
      vi.mock('./useGameTTS', () => ({
        useGameTTS: () => ({
          speakPrompt: speakPromptMock,
          speakTile: vi.fn(),
        }),
      }));

      // render with ttsEnabled = false
      // expect speakPromptMock NOT called
    });
  });
  ```

  Run to confirm FAIL.

- [ ] **Step 2: Create `src/components/answer-game/useRoundTTS.ts`**

  ```ts
  import { useEffect } from 'react';
  import { useAnswerGameContext } from './useAnswerGameContext';
  import { useGameTTS } from './useGameTTS';

  export function useRoundTTS(prompt: string): void {
    const { roundIndex, config } = useAnswerGameContext();
    const { speakPrompt } = useGameTTS();

    useEffect(() => {
      if (!config.ttsEnabled) return;
      if (!prompt) return;
      speakPrompt(prompt);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roundIndex, config.ttsEnabled]);
  }
  ```

- [ ] **Step 3: Run tests**

  ```bash
  yarn test src/components/answer-game/useRoundTTS.test.tsx 2>&1 | tail -10
  ```

  Expected: PASS.

- [ ] **Step 4: Use `useRoundTTS` in `WordSpellSession`**

  In `src/games/word-spell/WordSpell/WordSpell.tsx`, inside `WordSpellSession`, add:

  ```tsx
  import { useRoundTTS } from '@/components/answer-game/useRoundTTS';

  // Inside WordSpellSession, after round is resolved:
  useRoundTTS(round?.word ?? '');
  ```

- [ ] **Step 5: Use `useRoundTTS` in `NumberMatchSession`**

  In `src/games/number-match/NumberMatch/NumberMatch.tsx`:

  ```tsx
  import { useRoundTTS } from '@/components/answer-game/useRoundTTS';

  // Inside NumberMatchSession:
  useRoundTTS(String(round?.value ?? ''));
  ```

- [ ] **Step 6: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5 && yarn test 2>&1 | tail -10
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/answer-game/useRoundTTS.ts \
    src/components/answer-game/useRoundTTS.test.tsx \
    src/games/word-spell/WordSpell/WordSpell.tsx \
    src/games/number-match/NumberMatch/NumberMatch.tsx
  git commit -m "feat(tts): auto-speak round prompt via useRoundTTS on round start"
  ```

---

## Task 9: Hide AudioButton when TTS disabled

**Files:**

- Modify: `src/components/questions/AudioButton/AudioButton.tsx`

- [ ] **Step 1: Update AudioButton to return null when TTS off**

  ```tsx
  import { Volume2 } from 'lucide-react';
  import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
  import { useGameTTS } from '@/components/answer-game/useGameTTS';

  interface AudioButtonProps {
    prompt: string;
  }

  export const AudioButton = ({ prompt }: AudioButtonProps) => {
    const { config } = useAnswerGameContext();
    const { speakPrompt } = useGameTTS();

    if (!config.ttsEnabled) return null;

    return (
      <button
        type="button"
        aria-label="Hear the question"
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:scale-95"
        onClick={() => speakPrompt(prompt)}
      >
        <Volume2 size={24} aria-hidden="true" />
      </button>
    );
  };
  ```

- [ ] **Step 2: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5 && yarn test 2>&1 | tail -10
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/questions/AudioButton/AudioButton.tsx
  git commit -m "feat(tts): hide AudioButton when ttsEnabled is false"
  ```

---

## Task 10: Final verification

- [ ] **Step 1: Run full quality gate**

  ```bash
  yarn lint 2>&1 | tail -10
  yarn typecheck 2>&1 | tail -5
  yarn test 2>&1 | tail -15
  ```

  Expected: all pass.

- [ ] **Step 2: Manual smoke check**

  Start `yarn dev`. Navigate to `/en/game/word-spell`:
  1. First page load → click AudioButton → voice speaks correctly on first try (not second)
  2. Drag a letter tile → voice speaks the letter
  3. Drop correct tile → "correct" sound plays
  4. Drop wrong tile → "wrong" sound plays, tile bounces back
  5. Complete a round → applause sound plays
  6. Complete all rounds → game-end tune plays
  7. Navigate to Settings → change speech rate to 1.5 → return to game → voice noticeably faster
  8. Change language to pt-BR → TTS speaks in Portuguese
  9. Go to Settings → disable TTS → AudioButton disappears from game
