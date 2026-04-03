import { useGameTTS } from '@/components/answer-game/useGameTTS';

interface ImageQuestionProps {
  src: string;
  prompt: string;
}

export const ImageQuestion = ({ src, prompt }: ImageQuestionProps) => {
  const { speakPrompt } = useGameTTS();

  return (
    <button
      type="button"
      aria-label={`${prompt} — tap to hear`}
      className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
      onClick={() => speakPrompt(prompt)}
    >
      <img
        src={src}
        alt={prompt}
        className="size-40 rounded-xl object-contain"
      />
    </button>
  );
};
