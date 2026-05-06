# Instructions + TTS Lifecycle (Spec 1a)

> **Spec ID:** `2026-05-03-instructions-tts-lifecycle`
> **Issue:** [#229 — Instructions + Text to Speech changes](https://github.com/leocaseiro/base-skill/issues/229)
> **Related:** [#230](https://github.com/leocaseiro/base-skill/issues/230) (deferred consumer of code-only customConfig overrides), [#257](https://github.com/leocaseiro/base-skill/issues/257) (`useGameRound` extraction + bus namespace), [#300](https://github.com/leocaseiro/base-skill/issues/300) (simplified-form preset picker — separate spec), Spec 1b (phoneme speech + round-end explain sequence — separate spec), Spec 2 (how-to-play tour + `?` icon — separate spec), [SRS v1 spec](2026-05-01-srs-v1-design.md) (parallel — shares bus events).

## 1. Summary

Replace the ad-hoc "speak the instruction text on the pre-game overlay, then speak only the bare answer at each round" model with a **lifecycle-driven TTS layer**, packaged as **three milestones** (see §3) so the user-visible win can ship this week alongside SRS v1 and #300:

1. **Rename `InstructionsOverlay`** to a **Game Options panel** that no longer auto-speaks how-to-play instructions on mount.
2. **Define 11 canonical lifecycle events** (`game.prepare`, `game.start`, `game.resume`, `round.start`, `round.idle`, `round.error`, `round.correct`, `round.celebrate`, `round.advance`, `level.complete`, `game.over`).
3. Introduce a **per-event verbosity model** (`off | brief | full`) with per-`(gameId, gradeBand)` defaults stored in a per-game template registry.
4. **Split the existing `ttsEnabled` flag** into `autoSpeak: boolean` (gates lifecycle auto-speech) and `ttsOnDemandAllowed: boolean` (gates user-tappable speech surfaces).
5. **Add a single Talkativeness preset (Quiet / Default / Chatty)** to the customConfig form; per-event control stays code-only for game designers via `customConfig.events`.
6. **Always-inline AudioButton** (icon left of question text, same on all breakpoints) that always speaks `full` when tapped (subject to `ttsOnDemandAllowed`).

Audience for the configuration surfaces: **parents** (light tinkerers), **teachers** (classroom setup), **game designers** (defaults via `customConfig` in code).

The design subscribes to the **existing `GameEventBus`** ([src/types/game-events.ts:133](src/types/game-events.ts:133)); it does not introduce a parallel event system. New events are added to the bus, with namespace alignment to #257's `round:*` extension.

## 2. Goals

- Move instructional speech _inside_ the game (after "Let's go") rather than the pre-game panel.
- Let parents and teachers configure how chatty the game is — via a single Talkativeness preset, with code-only per-event control reserved for game designers.
- Provide game-level defaults that vary by `gradeBand` (`pre-k` / `k` / `year1-2` / `year3-4` / `year5-6`).
- Make in-round on-demand speech a reliable "explain-it-again" affordance, decoupled from the auto-speak setting via `ttsOnDemandAllowed`.
- Keep wiring compatible with #257's `round:*` namespace and the SRS v1 recorder so every TTS playback is observable for SRS attempt records.

## 3. Milestones & Non-Goals

### M1 — Minimum viable copy fix (this week, ships alongside SRS v1 + #300)

The user-visible deliverables from #229:

- Rename `InstructionsOverlay` → `GameOptionsOverlay`; remove pre-game auto-speak of how-to-play.
- Speak `game.start` full instructions after "Let's go".
- Fix NumberMatch's "speak the answer" bug — use a registry-backed instructional template (`"Find the matching number for {{count}}."`) instead of speaking the bare numeral.
- Split `ttsEnabled` into `autoSpeak` + `ttsOnDemandAllowed`.
- Replace `InstructionsOverlay`'s auto-speak overlay with `game.prepare` brief speech (`"{{gameName}}"`).
- Always-inline AudioButton (icon left, single-line per game) on all four games; `SortNumbers` gains an AudioButton for the first time; `SpotAllPrompt`'s local `speakPrompt` consolidates into the shared `useLifecycleTTS` API.
- Talkativeness preset (Quiet / Default / Chatty) in `AdvancedConfigModal`.

### M2 — Lifecycle vocabulary, registry, full event surface

Foundation work the wider TTS system depends on:

- 11 lifecycle events emitted by the engine (and `round.idle` per-game).
- Per-game template registry with `byGradeBand` defaults for all four games (WordSpell, NumberMatch, SortNumbers, SpotAll).
- Resolver, queueing policy, ARIA live-region wiring, idle-timer contract.
- Code-only `customConfig.events` override surface for game designers.

### M3 — Spec 1b foundation

- Sets up the contract Spec 1b consumes (phoneme speech + round-end explain sequence).
- Themed skin TTS overrides land here when the first themed skin actually sets one.
- Free-text copy override for `customConfig.tts?` lands when [#230](https://github.com/leocaseiro/base-skill/issues/230) needs it.

### Non-Goals

| Item                                                                                                   | Lands in                      |
| ------------------------------------------------------------------------------------------------------ | ----------------------------- |
| WordSpell phoneme speech (replace letter-name speech with phonemes)                                    | **Spec 1b**                   |
| Round-end explain sequence (phoneme-by-phoneme highlight + whole word)                                 | **Spec 1b**                   |
| How-to-play tour overlay (reactour-style or video)                                                     | **Spec 2**                    |
| Persistent `?` help icon to revisit the tour                                                           | **Spec 2**                    |
| Free-text copy override per customConfig ([#230](https://github.com/leocaseiro/base-skill/issues/230)) | **M3 + #230**                 |
| Themed skin TTS overrides (`GameSkin.tts?`)                                                            | **M3 + first themed skin PR** |
| `game.pause` lifecycle event                                                                           | future (no current consumer)  |
| SRS scoring impact of mid-game pause/resume                                                            | future                        |

## 4. Lifecycle Event Vocabulary

Canonical events the TTS subscriber listens for. Engine emits the engine-owned events; games may emit game-specific extras (`round.idle` re-cues are game-driven).

| Event             | Source | When                                                  | Notes                                                                             |
| ----------------- | ------ | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| `game.prepare`    | engine | Game Options panel mounts                             | Light cue ("{{gameName}}")                                                        |
| `game.start`      | engine | "Let's go" clicked, AnswerGame mounts                 | Full how-to-play replaces pre-game speech                                         |
| `game.resume`     | engine | Browser refresh / mid-game return after backgrounding | Speaks `game.start` copy by registry duplication (no aliasing — see §6.4)         |
| `round.start`     | engine | First round mount and on each `roundIndex` change     | Reuses #257's `round:shown` emission to avoid dual sources                        |
| `round.idle`      | game   | Per-game timeout with no progress (see §4.2)          | Re-cue for stuck kids; defaults: 8s pre-K/K, 12s year1-2, off year3-4 / year5-6   |
| `round.error`     | engine | `game:evaluate` with `correct: false`                 | Future: "Try again — the word is {{word}}." Reads SRS v1 `mistake` payload (§4.3) |
| `round.correct`   | engine | `game:evaluate` with `correct: true`                  | Triggers Spec 1b explain sequence in pre-K/K mode                                 |
| `round.celebrate` | engine | After `round.correct`, post-explain, pre-advance      | Slot for mini-games + praise; reserved for Spec 1b orchestration                  |
| `round.advance`   | engine | `ADVANCE_ROUND` dispatched                            | Lets older players hear just the next target                                      |
| `level.complete`  | engine | `LevelCompleteOverlay` mounts                         | Speak summary                                                                     |
| `game.over`       | engine | `GameOverOverlay` mounts                              | Final summary                                                                     |

### 4.1 Bus event additions

Map the lifecycle to the existing `GameEventBus` ([src/types/game-events.ts](src/types/game-events.ts)) with namespace alignment to #257's `round:*` extension:

| Lifecycle event   | Bus event                          | Action                                                        |
| ----------------- | ---------------------------------- | ------------------------------------------------------------- |
| `game.prepare`    | `game:prepare` (new)               | add to bus                                                    |
| `game.start`      | `game:start`                       | reuse — must be emitted by `AnswerGameProvider` on mount      |
| `game.resume`     | `game:resume` (new)                | add to bus; emitted by `AnswerGameProvider` on remount detect |
| `round.start`     | `round:shown` (#257)               | reuse #257's emit from `useGameRound`; no parallel source     |
| `round.idle`      | `round:idle` (new)                 | add to bus; per-game timer fires it                           |
| `round.error`     | `game:evaluate` (`correct: false`) | reuse                                                         |
| `round.correct`   | `game:evaluate` (`correct: true`)  | reuse                                                         |
| `round.celebrate` | `round:celebrate` (new)            | add to bus                                                    |
| `round.advance`   | `game:round-advance`               | reuse — centralize emission in `answer-game-reducer`          |
| `level.complete`  | `game:level-advance`               | reuse — centralize emission in `answer-game-reducer`          |
| `game.over`       | `game:end`                         | reuse — emitted on `GameOverOverlay` mount path               |

**Bus events carry per-event payload.** Earlier draft language saying "no payload changes for now" was inaccurate — SRS v1 spec [§15.4](2026-05-01-srs-v1-design.md) defines payload-rich events (`round-shown { roundId, itemId, ts }`, `mistake { roundId, ts, expectedTile, actualTile, slotId, distractorSource }`, `tts-played { roundId, ts }`, `visibility-change { ts, hidden }`, `round-resolved { roundId, ts, outcome, finalAnswer? }`). Spec 1a's TTS subscriber does not consume those payloads (it pulls interpolation context from `AnswerGameContext`, see §6.5) — but the events themselves carry payloads for SRS and other consumers.

**Engine-emitter list (M2 work).** Several canonical events do not fire in `src/` today; the table above marks who must emit each one going forward. Implementation tasks:

- `AnswerGameProvider`: emit `game:start` on mount, `game:resume` when re-mounting into a session that was previously active.
- `answer-game-reducer`: emit `game:round-advance` on `ADVANCE_ROUND`, `game:level-advance` on `ADVANCE_LEVEL`, `game:end` on completion.
- `useGameRound` (#257): emit `round:shown` on round mount.
- Per-game idle timers: emit `round:idle` per §4.2.

Four new bus events: `game:prepare`, `game:resume`, `round:idle`, `round:celebrate`. Each follows the existing `BaseGameEvent` shape (extends `BaseGameEvent`); `round:idle` and `round:celebrate` align with #257's `round:*` namespace (multi-prefix wildcard support landed in that PR).

### 4.2 `round.idle` timer & trigger contract

Per-game default timeout, by gradeBand:

| gradeBand | Idle timeout | Behavior on first prompt |
| --------- | ------------ | ------------------------ |
| `pre-k`   | 8s           | Speak full re-cue        |
| `k`       | 8s           | Speak full re-cue        |
| `year1-2` | 12s          | Speak brief re-cue       |
| `year3-4` | off (∞)      | No re-cue                |
| `year5-6` | off (∞)      | No re-cue                |

Trigger predicate: `round.idle` fires once per round, N seconds after `round.start`, **if** no zone has received a correct placement **and** no tile has been picked up since round start. Reset rules: timer canceled on first correct placement; restarted (once) on first wrong placement.

### 4.3 Queueing policy

- **Round-internal transitions** (`round.correct → round.celebrate → round.advance`): cancel-on-new (Web Speech default). Latest event interrupts the previous utterance.
- **Repeated `round.error`**: drop-debounce. Errors fired within 1.5s of the prior `round.error` are dropped; the first speaks fully via the `whenSoundEnds` pattern from today's `useRoundTTS`.

## 5. Verbosity Model & Resolution

```ts
type Verbosity = 'off' | 'brief' | 'full';
```

Two resolution chains: one for verbosity, one for copy. Both walk per-game registry only — no skin or customConfig.tts? layer in M1/M2 (see §3 non-goals).

### 5.1 Verbosity chain ("how chatty?")

```text
customConfig.events[event]                          ← per-event override (code-only, M2)
  ↓ if undefined
talkativenessPreset → byGradeBand[gradeBand][event] ← Quiet / Default / Chatty preset (M1 form)
  ↓ if undefined
gameRegistry[gameId].byGradeBand[gradeBand][event]  ← per-game per-grade default
  ↓ if undefined
gameRegistry[gameId].default[event]                 ← per-game baseline default
```

The Talkativeness preset (Quiet / Default / Chatty) maps to a verbosity profile per gradeBand (e.g. Quiet at `year1-2` makes everything `off` except `round.start = brief`; Chatty at `pre-k` makes everything `full`). Profiles live in `src/lib/lifecycle-tts/talkativeness-presets.ts`.

### 5.2 Copy chain ("what is spoken")

Only consulted when verbosity is `'brief'` or `'full'` (not `'off'`).

```text
gameRegistry[gameId].tts[event][mode]               ← i18n key (default)
```

Single layer. Copy has no grade dimension — gradeBand picks the verbosity, verbosity picks the cell. Spec 1b adds skin/customConfig override layers if/when their UIs ship (M3).

### 5.3 Worked example

WordSpell, year1-2 customConfig, Talkativeness = Default, on `round.start` with `word = "cat"`:

- Verbosity: `customConfig.events['round.start']` → undefined → preset Default at year1-2 → undefined → `gameRegistry['word-spell'].byGradeBand['year1-2']['round.start']` → `'full'`.
- Copy: `gameRegistry['word-spell'].tts['round.start']['full']` → i18n key `tts.word-spell.round-start.full` → `"Spell the word {{word}}."` → speaks **"Spell the word cat."**

## 6. Per-Game Template Registry

### 6.1 Type shape

```ts
type LifecycleEvent =
  | 'game.prepare'
  | 'game.start'
  | 'game.resume'
  | 'game.over'
  | 'round.start'
  | 'round.idle'
  | 'round.error'
  | 'round.correct'
  | 'round.celebrate'
  | 'round.advance'
  | 'level.complete';

type Verbosity = 'off' | 'brief' | 'full';

type EventTemplate = {
  tts: { brief: string; full: string }; // i18n keys
  byGradeBand: Record<GradeBand, Verbosity>;
  default: Verbosity;
};

type GameLifecycleRegistryEntry = {
  events: Record<LifecycleEvent, EventTemplate>;
};

type GameLifecycleRegistry = Record<
  string /* gameId */,
  GameLifecycleRegistryEntry
>;
```

No `aliasOf` variant. `game.resume` registry entries duplicate `game.start`'s keys/verbosity directly (see §6.4).

### 6.2 Example: WordSpell registry entry

```ts
// src/lib/lifecycle-tts/registry/word-spell.ts
import type { GameLifecycleRegistryEntry } from '../types';

export const wordSpellRegistry: GameLifecycleRegistryEntry = {
  events: {
    'game.prepare': {
      tts: {
        brief: 'tts.word-spell.game-prepare.brief',
        full: 'tts.word-spell.game-prepare.full',
      },
      byGradeBand: {
        'pre-k': 'brief',
        k: 'brief',
        'year1-2': 'brief',
        'year3-4': 'brief',
        'year5-6': 'brief',
      },
      default: 'brief',
    },
    'game.start': {
      tts: {
        brief: 'tts.word-spell.game-start.brief',
        full: 'tts.word-spell.game-start.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'full',
        'year3-4': 'brief',
        'year5-6': 'brief',
      },
      default: 'full',
    },
    'game.resume': {
      // duplicates game.start keys + verbosity (no aliasing)
      tts: {
        brief: 'tts.word-spell.game-start.brief',
        full: 'tts.word-spell.game-start.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'full',
        'year3-4': 'brief',
        'year5-6': 'brief',
      },
      default: 'full',
    },
    'round.start': {
      tts: {
        brief: 'tts.word-spell.round-start.brief',
        full: 'tts.word-spell.round-start.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'full',
        'year3-4': 'brief',
        'year5-6': 'brief',
      },
      default: 'full',
    },
    'round.idle': {
      tts: {
        brief: 'tts.word-spell.round-idle.brief',
        full: 'tts.word-spell.round-idle.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'brief',
        'year3-4': 'off',
        'year5-6': 'off',
      },
      default: 'brief',
    },
    'round.error': {
      tts: {
        brief: 'tts.word-spell.round-error.brief',
        full: 'tts.word-spell.round-error.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'full',
        'year3-4': 'full',
        'year5-6': 'brief',
      },
      default: 'full',
    },
    'round.correct': {
      tts: {
        brief: 'tts.word-spell.round-correct.brief',
        full: 'tts.word-spell.round-correct.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'brief',
        'year3-4': 'off',
        'year5-6': 'off',
      },
      default: 'brief',
    },
    'round.celebrate': {
      tts: {
        brief: 'tts.word-spell.round-celebrate.brief',
        full: 'tts.word-spell.round-celebrate.full',
      },
      byGradeBand: {
        'pre-k': 'brief',
        k: 'brief',
        'year1-2': 'brief',
        'year3-4': 'brief',
        'year5-6': 'brief',
      },
      default: 'brief',
    },
    'round.advance': {
      tts: {
        brief: 'tts.word-spell.round-advance.brief',
        full: 'tts.word-spell.round-advance.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'brief',
        'year3-4': 'brief',
        'year5-6': 'off',
      },
      default: 'brief',
    },
    'level.complete': {
      tts: {
        brief: 'tts.word-spell.level-complete.brief',
        full: 'tts.word-spell.level-complete.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'full',
        'year3-4': 'full',
        'year5-6': 'brief',
      },
      default: 'full',
    },
    'game.over': {
      tts: {
        brief: 'tts.word-spell.game-over.brief',
        full: 'tts.word-spell.game-over.full',
      },
      byGradeBand: {
        'pre-k': 'full',
        k: 'full',
        'year1-2': 'full',
        'year3-4': 'full',
        'year5-6': 'brief',
      },
      default: 'full',
    },
  },
};
```

The exact verbosity values per `(gameId, gradeBand)` are starting points; game authors tune them. `LifecycleTTSExplorer.stories.tsx` (§13.2) renders these tables for game-designer review.

### 6.3 Resolver

```ts
// src/lib/lifecycle-tts/resolve.ts
export const resolveLifecycle = (params: {
  gameId: string;
  event: LifecycleEvent;
  gradeBand: GradeBand;
  customConfig: CustomConfigTTSOverrides | undefined;
  talkativeness: 'quiet' | 'default' | 'chatty';
  registry: GameLifecycleRegistry;
}): { verbosity: Verbosity; i18nKey: string | null } => {
  /* walks the two chains; pure function, no flag awareness */
};
```

The resolver is pure — it does not read `autoSpeak` or `ttsOnDemandAllowed`. The gate enforcement layer is `useLifecycleTTS` (see §7.2).

### 6.4 `game.resume` strategy

`game.resume` registry entries duplicate `game.start`'s keys and `byGradeBand` values directly (see WordSpell example above). No aliasing abstraction. If a game wants different copy on resume, it overrides the relevant fields locally.

### 6.5 Template variable sourcing

The lifecycle subscriber pulls interpolation context from the current `AnswerGameContext` snapshot at the moment of speech, not from the bus event payload. Bus events stay payload-honest for SRS and other consumers (§4.1) — TTS interpolation is a separate concern.

Per-game template-variable contracts (each registry entry documents the variables it consumes):

| Game        | Required context                                                      | Used in template variables                        |
| ----------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| WordSpell   | `round.word`, `gameName`                                              | `{{word}}`, `{{gameName}}`                        |
| NumberMatch | `round.value` (numeral or count), `gameName`                          | `{{count}}`, `{{gameName}}`                       |
| SortNumbers | `round.direction`, `round.from`, `round.to`, `round.step`, `gameName` | `{{direction}}`, `{{from}}`, `{{to}}`, `{{step}}` |
| SpotAll     | `round.target`, `gameName`                                            | `{{target}}`, `{{gameName}}`                      |
| All games   | `level`, `roundIndex`, `score`                                        | `{{count}}` (level summary), `{{gameName}}`       |

If a required variable is `undefined` or empty at speak time, `useLifecycleTTS` skips the speak (preserves today's empty-prompt short-circuit from `useRoundTTS`).

## 7. CustomConfig Schema Changes

### 7.1 New fields

```ts
// src/types/custom-config.ts (augment existing)
import type {
  LifecycleEvent,
  Verbosity,
} from '@/lib/lifecycle-tts/types';

export interface CustomConfigTTSOverrides {
  /**
   * Per-event verbosity override. When undefined, the talkativeness preset
   * (then registry byGradeBand default) is used.
   *
   * **Code-only in M1/M2 — not exposed in the form.** Game designers set
   * this on customConfigs in src/games/<game>/configs/. The Talkativeness
   * preset (Quiet / Default / Chatty) is the only parent/teacher surface.
   */
  events?: Partial<Record<LifecycleEvent, Verbosity>>;
}

export interface CustomConfigTalkativenessOverride {
  /** Quiet / Default / Chatty preset selected by parent or teacher. */
  talkativeness?: 'quiet' | 'default' | 'chatty';
}
```

These nest under the existing `customGame.config` blob.

**RxDB migration:** No schema version bump. `customGame.config` remains `Record<string, unknown>` per [src/db/schemas/custom_games.ts](src/db/schemas/custom_games.ts). Legacy customGames without `events` / `talkativeness` keys flow through the §5.1 fallthrough chain to registry defaults.

### 7.2 Flag rename: `ttsEnabled` → `autoSpeak` + new `ttsOnDemandAllowed`

The existing `ttsEnabled: boolean` flag on [AnswerGameConfig](src/components/answer-game/types.ts:17) (threaded via `useAnswerGameContext`, persisted in `customGame.config`, set in `AnswerGameProvider` defaults and `ConfigFormFields`) splits into two flags:

| Flag                 | Default | Gates                                                                                                                                      |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `autoSpeak`          | `true`  | All lifecycle auto-speech (every event in §4)                                                                                              |
| `ttsOnDemandAllowed` | `true`  | All user-initiated tap-to-speak: AudioButton, TextQuestion onClick, ImageQuestion onClick, EmojiQuestion onClick, DotGroupQuestion onClick |

| Setting combination                           | Auto-speak | On-demand tap                                        |
| --------------------------------------------- | ---------- | ---------------------------------------------------- |
| `autoSpeak: true, ttsOnDemandAllowed: true`   | ✅         | ✅                                                   |
| `autoSpeak: false, ttsOnDemandAllowed: true`  | ❌         | ✅ (full)                                            |
| `autoSpeak: true, ttsOnDemandAllowed: false`  | ✅         | ❌ (button hidden / silent)                          |
| `autoSpeak: false, ttsOnDemandAllowed: false` | ❌         | ❌ (hard mute — preserves silent-environment intent) |

**Migration / back-compat:** customGames with `ttsEnabled: false` map to `autoSpeak: false, ttsOnDemandAllowed: false` (preserves silence). Default new customGames receive `autoSpeak: true, ttsOnDemandAllowed: true`.

**Gate enforcement layer:** `useLifecycleTTS` reads both flags via React refs (so toggles take effect mid-round without remount). The resolver (§6.3) is pure and does not see the flags. Tests in `lifecycle-tts.test.ts` cover the hook-level ref read; tests in `useGameTTS.test.tsx` cover the per-call gate.

**Consumers (must honor the gate split):**

| Consumer                                                                  | Reads                |
| ------------------------------------------------------------------------- | -------------------- |
| `useLifecycleTTS` (auto-speak path)                                       | `autoSpeak`          |
| `useLifecycleTTS` (on-demand path)                                        | `ttsOnDemandAllowed` |
| `useGameTTS.speakAuto`                                                    | `autoSpeak`          |
| `useGameTTS.speakOnDemand`                                                | `ttsOnDemandAllowed` |
| AudioButton                                                               | `ttsOnDemandAllowed` |
| TextQuestion / ImageQuestion / EmojiQuestion / DotGroupQuestion (onClick) | `ttsOnDemandAllowed` |
| SpotAllPrompt (post-consolidation)                                        | `ttsOnDemandAllowed` |

### 7.3 Accessibility — ARIA live regions independent of TTS

When `autoSpeak: false`, round outcomes are still announced via ARIA live regions on the AnswerGame container. Visual confetti + color changes provide additional reinforcement. ARIA + visual cues are independent of the TTS layer; they always run regardless of `autoSpeak` and `ttsOnDemandAllowed`.

## 8. Skin Schema Changes

**Deferred to M3.** No `GameSkin.tts?` field in M1/M2. The first themed skin PR that ships actual themed copy adds the field with its concrete shape.

## 9. UI Changes

### 9.1 Game Options panel (renamed from `InstructionsOverlay`)

**File / directory rename:**

- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` → `src/components/answer-game/GameOptions/GameOptionsOverlay.tsx`
- Same for `.test.tsx`, `.stories.tsx`, and any `useConfigDraft.ts` co-located file.
- Storybook title: `'AnswerGame/InstructionsOverlay'` → `'AnswerGame/GameOptions/GameOptionsOverlay'` (PascalCase per CLAUDE.md).
- Update all imports across the codebase (e.g. `routes/$locale/_app/game/$gameId.tsx`). Run `rg -l InstructionsOverlay` and `rg -l SaveCustomGameInput` before renaming to catch e2e tests + type re-exports.

**Behavior change:**

- Remove the `useEffect(() => { if (ttsEnabled) speak(text); … }, [])` block from current `InstructionsOverlay.tsx:173-179`. Pre-game panel **does not auto-speak how-to-play instructions**.
- Subscribe to `game:prepare` instead — speaks the resolved `game.prepare` copy (default `brief` = `"{{gameName}}"`).
- Drop the `text` prop's instructional role. The visible content shifts to game name + simple-form preset slot + "Let's go".
- **No `?` help icon in M1** (Spec 2 adds the tour and the icon together).

**Visible structure (M1):**

```text
┌─────────────────────────────────────────────┐
│         [GameCover, hero]                   │
├─────────────────────────────────────────────┤
│  WordSpell                       [⭐][⚙]    │
│  ─────────────────────────────────────────  │
│  ( today's SimpleConfigForm — until #300 )  │
│  ─────────────────────────────────────────  │
│  ▶︎ Let's go                                 │
└─────────────────────────────────────────────┘
```

The `#300` slot renders today's `SimpleConfigForm` (via `getSimpleConfigFormRenderer(gameId)`) until #300 ships its preset picker. _See Deferred / Open Questions §15 for the open call on whether to keep, hide, or replace this slot pre-#300._

### 9.2 In-round AudioButton: always inline, icon left

**Layout — same on all breakpoints, all 4 games:**

```text
[🔊]   <question / instructional text>
```

| Game        | Layout                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| WordSpell   | AudioButton left, word display right; inline single line (wraps to extra line if needed)             |
| NumberMatch | AudioButton top-left, large numeral / dot group centered; row may stack if numeral exceeds row width |
| SortNumbers | AudioButton left, direction prompt right ("Sort ascending: 1 to 10")                                 |
| SpotAll     | Reuses today's SpotAllPrompt layout, consolidated to use shared `useLifecycleTTS`                    |

**Breakpoint rules:**

- AudioButton minimum tap target: 44 × 44 px (WCAG).
- Content wraps to additional lines if it exceeds available width — no truncation, no ellipsis.
- Stacked layout (button above content) only when single-line wrap exceeds 3 lines on mobile.

**Implementation:**

- Introduce `<QuestionRow>` wrapper at `src/components/questions/QuestionRow/QuestionRow.tsx` — text + audio button inline.
- WordSpell ([WordSpell.tsx:216](src/games/word-spell/WordSpell/WordSpell.tsx:216)) and NumberMatch ([NumberMatch.tsx:243-247](src/games/number-match/NumberMatch/NumberMatch.tsx:243)) consume `<QuestionRow>` in place of stacked siblings.
- SortNumbers gains a new AudioButton (currently has none) wired through `<QuestionRow>`.
- SpotAllPrompt's local `speakPrompt` function ([SpotAllPrompt.tsx:20](src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx:20)) consolidates into the shared `useLifecycleTTS` API — no separate code path.
- AudioButton renders **unconditionally** when `ttsOnDemandAllowed: true` (no `autoSpeak` gate).

### 9.3 AudioButton always-full behavior

```tsx
export const AudioButton = ({
  event = 'round.start',
}: {
  event?: LifecycleEvent;
}) => {
  const { speakOnDemand, ttsOnDemandAllowed } = useLifecycleTTS();

  if (!ttsOnDemandAllowed) return null;

  return (
    <button
      type="button"
      aria-label={t('common.audio.replay', {
        defaultValue: 'Hear the question',
      })}
      onClick={() => speakOnDemand(event, { mode: 'full' })}
      …
    />
  );
};
```

The button takes a lifecycle event name (default `round.start`) and lets `useLifecycleTTS` build the `full`-mode string from the per-game registry plus current `AnswerGameContext` payload (per §6.5). Game callers stop passing prompt strings.

**`round:tts-played` emission:** Both `speakAuto` and `speakOnDemand` paths emit #257's `round:tts-played` event so the SRS recorder counts every TTS playback (auto AND on-demand — repeated taps signal difficulty).

### 9.4 Talkativeness preset (form surface)

New section in `AdvancedConfigModal` titled **"Voice & Instructions"**. Single control:

```text
Voice & Instructions

  Talkativeness: ( ) Quiet  (•) Default  ( ) Chatty
```

- Three options. Default selected initially.
- Each option maps (per gradeBand) to a verbosity profile across all 11 events. Profiles defined in `src/lib/lifecycle-tts/talkativeness-presets.ts`.
- Per-event override (`customConfig.events`) is **code-only** — game designers set it on customConfigs in `src/games/<game>/configs/`. Not surfaced in the UI in M1/M2.
- No "Reset" button needed — the radio control directly toggles between three states.

## 10. i18n Keys

Pattern: `tts.<game-id>.<event-kebab>.<mode>`.

```jsonc
// src/lib/i18n/locales/en/games.json (new top-level "tts" key)
{
  "tts": {
    "word-spell": {
      "game-prepare": {
        "brief": "{{gameName}}",
        "full": "{{gameName}}. Tap Let's go to start, or pick a level.",
      },
      "game-start": {
        "brief": "Let's spell.",
        "full": "Let's spell some words. Drag the tiles to spell each word.",
      },
      "round-start": {
        "brief": "{{word}}",
        "full": "Spell the word {{word}}.",
      },
      "round-idle": {
        "brief": "{{word}}.",
        "full": "Drag a tile into a slot to spell {{word}}.",
      },
      "round-error": {
        "brief": "Try again.",
        "full": "Try again. The word is {{word}}.",
      },
      "round-correct": {
        "brief": "Yes!",
        "full": "Yes — {{word}}!",
      },
      "round-celebrate": {
        "brief": "Great job!",
        "full": "Great job spelling {{word}}!",
      },
      "round-advance": {
        "brief": "{{word}}",
        "full": "Now spell {{word}}.",
      },
      "level-complete": {
        "brief": "Level complete.",
        "full": "Level complete. You spelled {{count}} words.",
      },
      "game-over": {
        "brief": "Done.",
        "full": "Game over. You spelled {{count}} words.",
      },
    },
    "number-match": {
      "game-prepare": {
        "brief": "{{gameName}}",
        "full": "{{gameName}}. Tap Let's go to start, or pick a level.",
      },
      "round-start": {
        "brief": "Find {{count}}.",
        "full": "Find the matching number for {{count}}.",
      },
      "round-error": {
        "brief": "Try again.",
        "full": "Try again. Count the dots.",
      },
      "round-correct": {
        "brief": "Yes!",
        "full": "Yes — that's {{count}}!",
      },
      // … remaining events follow same shape
    },
    "sort-numbers": {
      "game-prepare": {
        "brief": "{{gameName}}",
        "full": "{{gameName}}. Tap Let's go to start, or pick a level.",
      },
      "round-start": {
        "brief": "{{direction}} from {{from}} to {{to}}",
        "full": "Sort these numbers in {{direction}} order, skip by {{step}}.",
      },
      "round-error": {
        "brief": "Not quite.",
        "full": "That's not in {{direction}} order yet. Try again.",
      },
      // … remaining events follow same shape
    },
    "spot-all": {
      "game-prepare": {
        "brief": "{{gameName}}",
        "full": "{{gameName}}. Tap Let's go to start, or pick a level.",
      },
      "round-start": {
        "brief": "Find all the {{target}}.",
        "full": "Find all the {{target}}. Tap each one to spot it.",
      },
      "round-error": {
        "brief": "Not that one.",
        "full": "That's not a {{target}}. Try another.",
      },
      // … remaining events follow same shape
    },
  },
}
```

Mirror keys in `pt-BR/games.json`. Translations are placeholder English at first; Portuguese values land in a follow-up.

The `instructions.*` keys remain (still used by the renamed Game Options panel for non-TTS labels: name dialogs, save prompts, etc.).

## 11. Implementation Plan Outline (file-level)

> Fine-grained sequencing lands in the implementation plan (writing-plans skill). This section is the architecture map.

### 11.1 New files

```text
src/lib/lifecycle-tts/
├── types.ts                    # LifecycleEvent, Verbosity, registry types
├── resolve.ts                  # verbosity + copy chains (pure)
├── useLifecycleTTS.ts          # hook: subscribes to GameEventBus, gates by autoSpeak / ttsOnDemandAllowed
├── talkativeness-presets.ts    # Quiet / Default / Chatty profiles per gradeBand
├── registry/
│   ├── index.ts                # GameLifecycleRegistry assembly
│   ├── word-spell.ts
│   ├── number-match.ts
│   ├── sort-numbers.ts
│   └── spot-all.ts
├── lifecycle-tts.test.ts
└── LifecycleTTSExplorer.stories.tsx   # registry table viewer for game-designer review

src/components/questions/QuestionRow/
├── QuestionRow.tsx
├── QuestionRow.stories.tsx
└── QuestionRow.test.tsx
```

### 11.2 Renamed / moved files

```text
src/components/answer-game/InstructionsOverlay/
  → src/components/answer-game/GameOptions/
     ├── GameOptionsOverlay.tsx        (was InstructionsOverlay.tsx)
     ├── GameOptionsOverlay.stories.tsx
     ├── GameOptionsOverlay.test.tsx
     └── useConfigDraft.ts             (unchanged content)
```

### 11.3 Modified files

| File                                                             | Change                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/game-events.ts`                                       | Add 4 new bus events: `game:prepare`, `game:resume`, `round:idle`, `round:celebrate`. (`round:*` namespace per #257.)                       |
| `src/components/answer-game/AnswerGameProvider.tsx`              | Emit `game:start` on mount; emit `game:resume` on remount-into-active-session.                                                              |
| `src/components/answer-game/answer-game-reducer.ts`              | Centralize emission of `game:round-advance`, `game:level-advance`, `game:end`.                                                              |
| `src/components/answer-game/types.ts`                            | Rename `ttsEnabled` → `autoSpeak`; add `ttsOnDemandAllowed`.                                                                                |
| `src/components/answer-game/useGameTTS.ts`                       | Split into `speakAuto` (gated by `autoSpeak`) and `speakOnDemand` (gated by `ttsOnDemandAllowed`). Both emit `round:tts-played`.            |
| `src/components/answer-game/useRoundTTS.ts`                      | **Removed.** Callers migrate to `useLifecycleTTS('round.start')`. Empty-prompt guard preserved via missing-template-variable check in §6.5. |
| `src/components/questions/AudioButton/AudioButton.tsx`           | Switch from `prompt` prop to lifecycle-event prop; always speak `full`; gate by `ttsOnDemandAllowed`.                                       |
| `src/components/questions/TextQuestion/TextQuestion.tsx`         | Route onClick speech through `speakOnDemand`; honor `ttsOnDemandAllowed`.                                                                   |
| `src/components/questions/ImageQuestion/ImageQuestion.tsx`       | Same.                                                                                                                                       |
| `src/components/questions/EmojiQuestion/EmojiQuestion.tsx`       | Same.                                                                                                                                       |
| `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` | Same.                                                                                                                                       |
| `src/games/word-spell/WordSpell/WordSpell.tsx`                   | Use `<QuestionRow>`; pass event prop to AudioButton.                                                                                        |
| `src/games/number-match/NumberMatch/NumberMatch.tsx`             | Use `<QuestionRow>`; pass event prop to AudioButton; richer instructional copy via registry.                                                |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`             | **Add AudioButton (currently missing)** via `<QuestionRow>`; subscribe to `useLifecycleTTS`.                                                |
| `src/games/spot-all/SpotAll/SpotAll.tsx`                         | Subscribe to `useLifecycleTTS`.                                                                                                             |
| `src/games/spot-all/SpotAllPrompt/SpotAllPrompt.tsx`             | Consolidate local `speakPrompt` into `useLifecycleTTS`.                                                                                     |
| `src/components/AdvancedConfigModal.tsx`                         | Add "Voice & Instructions" section with single Talkativeness preset.                                                                        |
| `src/lib/i18n/locales/{en,pt-BR}/games.json`                     | Add `tts.*` keys for all 4 games + form labels under `instructions.voiceAndInstructions.*`.                                                 |
| `src/routes/$locale/_app/game/$gameId.tsx`                       | Update `InstructionsOverlay` import to `GameOptionsOverlay`.                                                                                |
| `src/db/schemas/custom_games.ts`                                 | _No change._ Config blob stays `Record<string, unknown>`; no version bump.                                                                  |

### 11.4 Tests

- `lifecycle-tts.test.ts` — verbosity resolver (pure), copy resolver, missing-override fallthrough, missing-template-variable skip.
- `useLifecycleTTS.test.tsx` — bus subscriptions, `autoSpeak` gate via ref read (toggle mid-round takes effect), `ttsOnDemandAllowed` gate, queue policy (cancel-on-new for round-internal events, drop-debounce for repeated `round.error`).
- `useGameTTS.test.tsx` — `speakAuto` gated by `autoSpeak`, `speakOnDemand` gated by `ttsOnDemandAllowed`, both emit `round:tts-played`.
- `GameOptionsOverlay.test.tsx` — no auto-speak on mount; `game:prepare` emitted; SimpleConfigForm fallback renders pre-#300.
- `AudioButton.test.tsx` — renders when `ttsOnDemandAllowed: true`; calls `speakOnDemand` with mode `full`; null otherwise.
- `talkativeness-presets.test.ts` — Quiet / Default / Chatty profile resolution per gradeBand.

### 11.5 Storybook stories

Per `write-storybook` skill conventions:

- `GameOptionsOverlay.stories.tsx` — Playground with config draft control.
- `QuestionRow.stories.tsx` — Playground with text + audio button slot.
- `AudioButton.stories.tsx` — flip `event` prop and `customConfig.events` config.
- `LifecycleTTSExplorer.stories.tsx` — registry table viewer for game-designer review (see §13.2).

### 11.6 Architecture docs

Game-state engine touch-points trigger `update-architecture-docs` (per CLAUDE.md): the AnswerGame reducer, `useRoundTTS` removal, AudioButton refactor. Co-located `.mdx` docs update in the same PR.

## 12. Spec 1b Preview (M3 — for awareness only)

Spec 1a explicitly does **not** ship these; the lifecycle event vocabulary supports them when 1b lands.

1. **WordSpell phoneme speech.** `speakTile` callers in WordSpell pass the phoneme `(p)` from word-data `(g, p)` pairs instead of letter names. Phoneme data already lives on word records (cf. WordFilter `graphemesAllowed` `(g, p)` contract).
2. **Round-end explain sequence.** On `round.correct` for `pre-k`/`k` verbosity ladder: for each placed grapheme cluster → highlight tile + speak phoneme → after final → highlight whole word + speak full word → fire `round.celebrate`.
3. **Highlight tokens.** Add `--skin-tile-speaking-bg`, `--skin-tile-speaking-fg`, `--skin-tile-speaking-outline` skin tokens. Tile component reads `data-speaking="true"`.
4. **Orchestration hook.** `useExplainSequence(word, phonemes)` driven by Web Speech `onstart`/`onend` events.
5. **`round.error` "Try again — the word is X"** wiring uses SRS v1's `mistake` payload (per §4.1) — `expectedTile`, `actualTile`, `slotId`, `distractorSource` are all available for game-specific error reasons.

Spec 1b will reference Spec 1a as the foundation contract.

## 13. Open Items / Future References

### 13.1 Issue cross-links

- Spec 1a depends on the existing `GameEventBus` infrastructure ([src/types/game-events.ts:133](src/types/game-events.ts:133)) and #257's `round:*` namespace extension.
- The simplified preset picker in the Game Options panel is a placeholder slot for [issue #300](https://github.com/leocaseiro/base-skill/issues/300). M1 falls back to today's `SimpleConfigForm`.
- Free-text `customConfig.tts?` lands when [issue #230](https://github.com/leocaseiro/base-skill/issues/230) ships its UI (M3).
- Spec 2 (tour + `?` icon) and Spec 1b (phoneme + round-end explain) tracked separately under #229's umbrella.
- After this spec lands, comment on #230 noting M3 will introduce the `customConfig.tts?` field when its consumer arrives.

### 13.2 Storybook surface for the registry

`LifecycleTTSExplorer.stories.tsx` renders a table per gameId for game-designer review:

```text
WordSpell                                                    [Switch gradeBand: year1-2 ▾]

  Event              | Verbosity | brief                | full
  ------------------ | --------- | -------------------- | ------------------------------------
  game.prepare       | brief     | WordSpell            | WordSpell. Tap Let's go to start…
  game.start         | full      | Let's spell.         | Let's spell some words. Drag…
  round.start        | full      | cat                  | Spell the word cat.
  …
```

Game designers use this to tune `byGradeBand` defaults and per-event copy without reading TypeScript registry files.

### 13.3 Coordination with #257 (`useGameRound` extraction)

Issue #257 introduces a `round:*` namespace on `GameEventBus` with multi-prefix wildcard support. Spec 1a depends on this extension for `round:idle` and `round:celebrate`, and reuses `round:shown` from `useGameRound` instead of deriving `round.start` from `roundIndex` changes.

Sequencing: **#257 lands first or co-merges with M2.** M1 only requires the existing `game:*` events plus `game:prepare` (additive) — it can ship before #257 if needed.

### 13.4 Coordination with SRS v1 spec

- SRS v1 ([2026-05-01-srs-v1-design.md](2026-05-01-srs-v1-design.md)) consumes the same bus surface. Bus events carry payloads per SRS spec §15.4.
- Both `speakAuto` and `speakOnDemand` paths emit `round:tts-played` so SRS counts every TTS playback.
- `round.idle` is reserved as an SRS v2 difficulty signal (§13.3 of SRS spec).
- `game:resume` flows through SRS for "kid stopped half-way and came back tomorrow" handling (deferred from Spec 1a, scoped on SRS side).

## 14. Acceptance Criteria

### M1 (this week, ships alongside SRS v1 + #300)

- [ ] `InstructionsOverlay` renamed to `GameOptionsOverlay`; **does not auto-speak** how-to-play on mount.
- [ ] `game:prepare` (new bus event) speaks `{{gameName}}` brief copy on Game Options panel mount.
- [ ] `game.start` speaks the full how-to-play copy after "Let's go".
- [ ] NumberMatch's "speak the answer" bug fixed — registry-backed instructional template (`"Find the matching number for {{count}}."`) replaces bare-numeral speech.
- [ ] `ttsEnabled` renamed to `autoSpeak`; new `ttsOnDemandAllowed` flag added (default `true`); migration maps legacy `ttsEnabled: false` → `autoSpeak: false, ttsOnDemandAllowed: false`.
- [ ] AudioButton renders when `ttsOnDemandAllowed: true`; always speaks the resolved `full` copy for its event.
- [ ] All four game-question components (TextQuestion, ImageQuestion, EmojiQuestion, DotGroupQuestion) honor `ttsOnDemandAllowed` via `speakOnDemand`.
- [ ] `<QuestionRow>` renders inline (icon left, content right) on all breakpoints; AudioButton ≥ 44 × 44 px; content wraps to extra lines (no truncation).
- [ ] SortNumbers gains an AudioButton (currently missing).
- [ ] SpotAllPrompt's local `speakPrompt` consolidates into `useLifecycleTTS`.
- [ ] Talkativeness preset (Quiet / Default / Chatty) lands in `AdvancedConfigModal`.
- [ ] WordSpell registry entry exists with documented `byGradeBand` defaults.
- [ ] i18n keys for `tts.word-spell.*` and `tts.number-match.round-start.*` exist in `en` and `pt-BR` (Portuguese strings may be placeholder English pending translation).
- [ ] ARIA live region announces round outcomes independently of TTS.

### M2 (lifecycle vocabulary, full event surface)

- [ ] All 11 lifecycle events subscribed via `useLifecycleTTS` (engine-driven for 10 events; game-driven for 1 (`round.idle`)).
- [ ] Four new bus events added to `GameEventBus`: `game:prepare`, `game:resume`, `round:idle`, `round:celebrate`.
- [ ] Engine emit list wired: `AnswerGameProvider` (`game:start`, `game:resume`), `answer-game-reducer` (`game:round-advance`, `game:level-advance`, `game:end`), `useGameRound` (`round:shown` per #257).
- [ ] Per-game registry entries exist for **all four games** (WordSpell, NumberMatch, SortNumbers, SpotAll) with documented `byGradeBand` defaults.
- [ ] All `tts.*` i18n keys present for all four games in `en` and `pt-BR`.
- [ ] Code-only `customConfig.events` override surface works (game-designer-tested via Storybook Explorer).
- [ ] `round.idle` timer + trigger predicate per §4.2 implemented.
- [ ] Queue policy per §4.3 implemented.
- [ ] `LifecycleTTSExplorer.stories.tsx` surfaces registry tables for all four games.
- [ ] `useRoundTTS` removed from codebase; all callers migrated to `useLifecycleTTS`.
- [ ] All TDD regression tests exist (verbosity resolver, ref-based gate, queue policy, idle timer).
- [ ] Architecture docs (`.mdx`) co-located with modified game-state files updated in the same PR per CLAUDE.md.

### M3 (Spec 1b foundation)

Acceptance criteria for M3 land in Spec 1b's own design.

## 15. Deferred / Open Questions

### From 2026-05-03 ce-doc-review walk-through

- **`#300` placeholder slot pre-ship behavior.** Is the M1 fallback truly today's `SimpleConfigForm` (recommended), or should the panel collapse to name + "Let's go" until #300 ships its preset picker? Decided to defer — implementer makes the call when M1 routes are stitched. Track outcome in the eventual #300 PR.

---

**Status:** Spec reviewed via `/compound-engineering:ce-doc-review` on 2026-05-03 (6 reviewer personas, 30 findings); revisions incorporated. Ready for implementation plan (writing-plans skill, next step).
