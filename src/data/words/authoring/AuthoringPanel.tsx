import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { generateBreakdown } from './engine';
import type { Breakdown } from './engine';

export interface AuthoringPanelProps {
  open: boolean;
  onClose: () => void;
  initialWord: string;
  onSaved?: () => void;
}

const DEBOUNCE_MS = 400;

const useDebouncedBreakdown = (
  word: string,
): { breakdown: Breakdown | null; loading: boolean } => {
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = word.trim();
    if (!trimmed) {
      setBreakdown(null);
      return;
    }
    let ignore = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const b = await generateBreakdown(trimmed);
        if (!ignore) setBreakdown(b);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [word]);

  return { breakdown, loading };
};

export const AuthoringPanel = ({
  open,
  onClose,
  initialWord,
  onSaved: _onSaved,
}: AuthoringPanelProps) => {
  const titleId = useId();
  const wordInputId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [word, setWord] = useState(initialWord);
  const { breakdown } = useDebouncedBreakdown(word);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [open, handleKey]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 md:p-6"
    >
      <div className="flex h-full w-full flex-col bg-white p-6 md:h-auto md:max-w-2xl md:rounded-xl md:shadow-2xl">
        <h2 id={titleId} className="text-xl font-semibold">
          Make up a word
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Authoring <strong>{initialWord || '(new word)'}</strong>.
          Fields below populate as you type.
        </p>
        <div className="mt-4 flex-1 space-y-4 overflow-auto">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={wordInputId}
              className="text-sm font-medium"
            >
              Word
            </label>
            <input
              ref={inputRef}
              id={wordInputId}
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </div>
          {breakdown && !breakdown.ritaKnown && word.trim() && (
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
              RitaJS doesn&apos;t know <strong>{word.trim()}</strong>.
              Look it up →{' '}
              <a
                href={`https://www.dictionary.com/browse/${encodeURIComponent(word.trim())}`}
                target="_blank"
                rel="noreferrer noopener"
                className="underline"
              >
                Open in dictionary.com
              </a>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-slate-700 hover:bg-slate-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled
            className="rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Save draft
          </button>
        </div>
      </div>
    </div>
  );
};
