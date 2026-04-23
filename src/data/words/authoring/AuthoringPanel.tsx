import { useCallback, useEffect, useId, useRef } from 'react';

export interface AuthoringPanelProps {
  open: boolean;
  onClose: () => void;
  initialWord: string;
  onSaved?: () => void;
}

export const AuthoringPanel = ({
  open,
  onClose,
  initialWord,
  onSaved: _onSaved,
}: AuthoringPanelProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

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
    if (open) dialogRef.current?.focus();
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
        <div
          className="mt-4 flex-1 overflow-auto"
          data-testid="authoring-body"
        />
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
