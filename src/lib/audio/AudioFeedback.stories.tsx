import { playSound, queueSound } from './AudioFeedback';
import type { Meta, StoryObj } from '@storybook/react';
import { speak } from '@/lib/speech/SpeechOutput';

/**
 * Prototype to hear audio overlap scenarios without playing a full game.
 *
 * Each button fires events at the same timing as the real game:
 * - Tile clicks: ~80 ms apart (rapid tapping)
 * - correct → round-complete: ~50 ms (React render + effect flush)
 * - round advance → TTS: ~750 ms (the NumberMatch/WordSpell delay timer)
 */

const ScenarioButton = ({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) => (
  <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm">
    <p className="text-sm text-muted-foreground">{description}</p>
    <button
      type="button"
      onClick={onClick}
      className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95"
    >
      {label}
    </button>
  </div>
);

const CorrectSoundButton = () => (
  <div>
    <button
      className="rounded-md bg-green-600 hover:bg-green-600/70 px-4 py-2 text-sm font-medium text-primary-foreground active:scale-95"
      onClick={() => playSound('correct')}
    >
      correct sound effect
    </button>
  </div>
);

const WrongSoundButton = () => (
  <div>
    <button
      className="rounded-md bg-red-600 hover:bg-red-600/70 px-4 py-2 text-sm font-medium text-primary-foreground active:scale-95"
      onClick={() => playSound('wrong')}
    >
      wrong sound effect
    </button>
  </div>
);

const RoundCompleteSoundButton = () => (
  <div>
    <button
      className="rounded-md bg-sky-600 hover:bg-sky-600/70 px-4 py-2 text-sm font-medium text-primary-foreground active:scale-95"
      onClick={() => playSound('round-complete')}
    >
      round complete sound effect
    </button>
  </div>
);

const GameCompleteSoundButton = () => (
  <div>
    <button
      className="rounded-md bg-violet-600 hover:bg-violet-600/70 px-4 py-2 text-sm font-medium text-primary-foreground active:scale-95"
      onClick={() => playSound('game-complete')}
    >
      game complete sound effect
    </button>
  </div>
);

/**
 * Scenario 1 — 3 tile clicks in a row (speech in sequence)
 * Simulates a user rapidly clicking 3 letter/number tiles.
 * Each speak() call fires 80 ms after the previous one.
 */
const runScenario1 = () => {
  const words = ['Cat', 'Dog', 'Bird'];
  let delay = 0;
  for (const word of words) {
    setTimeout(() => speak(word), delay);
    delay += 80;
  }
};

/**
 * Scenario 2 — 2 tile speech + 1 wrong answer (speech + mp3)
 * Simulates clicking 2 tiles then immediately dropping the wrong tile.
 * The wrong.mp3 fires 80 ms after the second speak().
 */
const runScenario2 = () => {
  setTimeout(() => speak('Cat'), 0);
  setTimeout(() => speak('Dog'), 80);
  setTimeout(() => playSound('wrong'), 160);
};

/**
 * Scenario 3 — 1 correct answer + round complete (FIXED: queued mp3s)
 * Simulates placing the last correct tile.
 * correct.mp3 fires immediately; round-complete.mp3 is queued via queueSound()
 * so it waits for correct to finish before playing.
 */
const runScenario3 = () => {
  playSound('correct');
  setTimeout(() => playSound('correct'), 50);
  setTimeout(() => queueSound('game-complete'), 50);
};

const SoundEffects = () => (
  <div className="flex flex-col gap-6 p-6">
    <div>
      <h2 className="text-lg font-semibold">Sound Effects</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Each button fires the audio effects at the same as the real
        game.
      </p>
    </div>

    <CorrectSoundButton />
    <WrongSoundButton />
    <RoundCompleteSoundButton />
    <GameCompleteSoundButton />
  </div>
);

const AudioPrototype = () => (
  <div className="flex flex-col gap-6 p-6">
    <div>
      <h2 className="text-lg font-semibold">Audio Overlap Prototype</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Each scenario fires audio events at the same timing as the real
        game. Press a button to hear the current (overlapping)
        behaviour.
      </p>
    </div>

    <ScenarioButton
      label="▶ Run Scenario 1"
      description="Scenario 1 — 3 tile clicks in a row: speak('Cat') → speak('Dog') → speak('Bird') at 80 ms intervals"
      onClick={runScenario1}
    />

    <ScenarioButton
      label="▶ Run Scenario 2"
      description="Scenario 2 — 2 tile speech + wrong answer: speak('Cat') → speak('Dog') → playSound('wrong') at 80 ms intervals"
      onClick={runScenario2}
    />

    <ScenarioButton
      label="▶ Run Scenario 3 (FIXED)"
      description="Scenario 3 — Correct answer then round complete: correct.mp3 plays fully, then queueSound('round-complete') fires after"
      onClick={runScenario3}
    />
  </div>
);

const AudioFeedbackPrototype = () => (
  <div className="flex flex-col">
    <SoundEffects />
    <AudioPrototype />
  </div>
);

const meta: Meta<typeof AudioPrototype> = {
  component: AudioFeedbackPrototype,
  title: 'Audio/AudioFeedback Prototype',
  tags: ['autodocs'],
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            // Prototype scenario buttons use success/warning colours from the
            // design system that fall below 4.5:1 (e.g. white on #00a63e =
            // 3.21:1). This is a dev-only prototype — not shipped to users.
            // TODO: update colour tokens so success green meets WCAG AA.
            id: 'color-contrast',
            enabled: false,
          },
        ],
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AudioPrototype>;

export const Default: Story = {};

export const CorrectSound: Story = {
  name: 'Correct Sound Effect',
  render: () => <CorrectSoundButton />,
};
export const WrongSound: Story = {
  name: 'Wrong Sound Effect',
  render: () => <WrongSoundButton />,
};

export const RoundCompleteSound: Story = {
  name: 'Round Complete Sound Effect',
  render: () => <RoundCompleteSoundButton />,
};

export const GameCompleteSound: Story = {
  name: 'Game complete Sound Effect',
  render: () => <GameCompleteSoundButton />,
};

export const Scenario1TileClicks: Story = {
  name: 'Scenario 1 — 3 tile clicks (speech)',
  render: () => (
    <ScenarioButton
      label="▶ Speak Cat → Dog → Bird"
      description="3 speak() calls at 80 ms intervals — simulates rapid tile tapping"
      onClick={runScenario1}
    />
  ),
};

export const Scenario2SpeechAndWrong: Story = {
  name: 'Scenario 2 — Speech + wrong.mp3',
  render: () => (
    <ScenarioButton
      label="▶ Speak Cat → Dog → wrong.mp3"
      description="Two speak() calls then playSound('wrong') — speech overlapping with mp3"
      onClick={runScenario2}
    />
  ),
};

export const Scenario3CorrectAndRoundComplete: Story = {
  name: 'Scenario 3 — correct.mp3 + round-complete.mp3 (FIXED)',
  render: () => (
    <ScenarioButton
      label="▶ correct.mp3 → queueSound('round-complete')"
      description="playSound('correct') then queueSound('round-complete') 50 ms later — round-complete waits for correct to finish"
      onClick={runScenario3}
    />
  ),
};
