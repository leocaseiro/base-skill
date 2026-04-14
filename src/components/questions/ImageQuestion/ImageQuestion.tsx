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
      className="focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: 'var(--skin-question-bg)',
        color: 'var(--skin-question-text)',
        borderRadius: 'var(--skin-question-radius)',
        overflow: 'hidden',
      }}
      onClick={() => speakPrompt(prompt)}
    >
      <img
        src={src}
        alt={prompt}
        className="size-40 object-contain"
        style={{ borderRadius: 'var(--skin-question-radius)' }}
      />
    </button>
  );
};
