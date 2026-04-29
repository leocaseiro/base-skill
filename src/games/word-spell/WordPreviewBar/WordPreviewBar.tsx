import { useFilteredWords } from '../useFilteredWords';
import type { WordFilter } from '@/data/words';
import type { JSX } from 'react';

const PREVIEW_LIMIT = 24;

type Props = {
  filter: WordFilter;
};

export const WordPreviewBar = ({ filter }: Props): JSX.Element => {
  const { hits, isLoading } = useFilteredWords(filter);

  const baseClass =
    'rounded-lg px-3 py-2 text-center font-mono text-sm bg-muted text-foreground';

  if (isLoading) {
    return (
      <div data-testid="word-preview-bar" className={baseClass}>
        Loading…
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div
        data-testid="word-preview-bar"
        className={`${baseClass} text-destructive`}
      >
        Pick at least one sound to play.
      </div>
    );
  }

  const preview = hits
    .slice(0, PREVIEW_LIMIT)
    .map((h) => h.word)
    .join(', ');
  const more =
    hits.length > PREVIEW_LIMIT ? `, … (${hits.length} total)` : '';

  return (
    <div data-testid="word-preview-bar" className={baseClass}>
      {preview}
      {more}
    </div>
  );
};
