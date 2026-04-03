import { useGameTTS } from '@/components/answer-game/useGameTTS';

interface EmojiQuestionProps {
  /** One or more code points (e.g. a single emoji or a ZWJ sequence). */
  emoji: string;
  prompt: string;
}

export const EmojiQuestion = ({
  emoji,
  prompt,
}: EmojiQuestionProps) => {
  const { speakPrompt } = useGameTTS();

  return (
    <button
      type="button"
      aria-label={`${prompt} — tap to hear`}
      className="rounded-xl p-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      onClick={() => speakPrompt(prompt)}
    >
      <span
        className="block text-[7rem] leading-none select-none"
        aria-hidden="true"
      >
        {emoji}
      </span>
    </button>
  );
};
