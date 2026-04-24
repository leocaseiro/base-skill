import { useCallback, useEffect, useState } from 'react';
import { draftStore } from './draftStore';
import type { DraftEntry } from '../types';

export interface DraftsPanelProps {
  open: boolean;
  onClose: () => void;
  onEdit: (draft: DraftEntry) => void;
  /**
   * Called after a draft is mutated from inside the panel (currently
   * only delete). Lets the parent invalidate any cached views (the
   * WordLibraryExplorer grid in particular) without re-opening the
   * panel.
   */
  onMutated?: () => void;
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const exportDraftsToFile = async () => {
  const exported = await draftStore.exportDrafts();
  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: 'application/json',
  });
  const iso = new Date().toISOString().replaceAll(/[:.]/g, '-');
  triggerDownload(blob, `wordlib-export-${iso}.json`);
};

const deleteDraft = async (id: string, onDeleted: () => void) => {
  if (!globalThis.confirm('Delete this draft?')) return;
  await draftStore.deleteDraft(id);
  onDeleted();
};

export const DraftsPanel = ({
  open,
  onClose,
  onEdit,
  onMutated,
}: DraftsPanelProps) => {
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);

  const refresh = useCallback(() => {
    let ignore = false;
    void draftStore.listDrafts({ region: 'aus' }).then((list) => {
      if (!ignore) setDrafts(list);
    });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    return refresh();
  }, [open, refresh]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Drafts"
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white p-4 shadow-2xl"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Drafts ({drafts.length})
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close drafts"
        >
          ×
        </button>
      </header>
      <button
        type="button"
        onClick={() => {
          void exportDraftsToFile();
        }}
        className="mt-3 rounded bg-sky-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        disabled={drafts.length === 0}
      >
        Export drafts ({drafts.length})
      </button>
      <ul className="mt-4 divide-y">
        {drafts.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between py-2"
          >
            <div>
              <div className="font-medium">{d.word}</div>
              <div className="text-xs text-slate-500">
                L{d.level} · {new Date(d.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(d)}
                className="rounded border px-2 py-1 text-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  void deleteDraft(d.id, () => {
                    refresh();
                    onMutated?.();
                  });
                }}
                className="rounded border border-rose-300 px-2 py-1 text-sm text-rose-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
