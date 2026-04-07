import { parseSentenceTemplate } from './parse-sentence-template';
import { Slot } from './Slot';

interface SentenceWithGapsProps {
  sentence: string;
  className?: string;
}

export const SentenceWithGaps = ({
  sentence,
  className,
}: SentenceWithGapsProps) => {
  const segments = parseSentenceTemplate(sentence);

  return (
    <p
      className={['text-lg leading-relaxed', className]
        .filter(Boolean)
        .join(' ')}
    >
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <Slot
            key={`gap-${String(seg.index)}`}
            index={seg.index}
            as="span"
            className="mx-1 inline-flex min-w-16 items-center justify-center border-b-2 border-dashed px-2 align-baseline"
          >
            {({ label }) => (
              <span className="text-lg font-bold">
                {label ?? '\u00A0'}
              </span>
            )}
          </Slot>
        ),
      )}
    </p>
  );
};
