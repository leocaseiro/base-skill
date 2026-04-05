// src/components/SavedConfigChip.tsx
import { useState } from 'react';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { ConfigField } from '@/lib/config-fields';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { BOOKMARK_COLORS } from '@/lib/bookmark-colors';
import { configToTags } from '@/lib/config-tags';

type SavedConfigChipProps = {
  doc: SavedGameConfigDoc;
  configFields: ConfigField[];
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (
    id: string,
    config: Record<string, unknown>,
    name: string,
  ) => Promise<void>;
};

export const SavedConfigChip = ({
  doc,
  configFields,
  onPlay,
  onDelete,
  onSave,
}: SavedConfigChipProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false);
  const [editConfig, setEditConfig] = useState(doc.config);
  const [editName, setEditName] = useState(doc.name);

  const colorKey = doc.color as BookmarkColorKey;
  const colors = BOOKMARK_COLORS[colorKey];
  const tags = configToTags(doc.config);

  const handleCancel = () => {
    setEditConfig(doc.config);
    setEditName(doc.name);
    setExpanded(false);
  };

  const handleSave = async () => {
    await onSave(doc.id, editConfig, editName);
    setExpanded(false);
  };

  return (
    <div
      className="overflow-hidden rounded-xl border-2"
      style={{
        borderColor: expanded ? colors.playBg : colors.border,
        boxShadow: expanded ? `0 0 0 3px ${colors.bg}` : undefined,
      }}
    >
      {/* Header row */}
      <div
        className="flex min-h-12 items-stretch"
        style={{ background: expanded ? colors.playBg : colors.tagBg }}
      >
        <button
          type="button"
          aria-label={`Expand ${doc.name}`}
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-12 flex-1 items-center gap-2 px-3 text-left"
        >
          <span
            className="text-sm font-semibold"
            style={{ color: expanded ? 'white' : colors.headerText }}
          >
            {doc.name}
          </span>
          <span
            className="ml-auto text-xs"
            style={{
              color: expanded
                ? 'rgba(255,255,255,0.7)'
                : colors.tagText,
            }}
          >
            {expanded ? '▲' : '▼'}
          </span>
        </button>
        <button
          type="button"
          aria-label={`Play ${doc.name}`}
          onClick={() => onPlay(doc.id)}
          className="flex min-h-12 w-12 items-center justify-center text-sm text-white"
          style={{ background: colors.playBg }}
        >
          ▶
        </button>
        <button
          type="button"
          aria-label={`Delete ${doc.name}`}
          onClick={() => onDelete(doc.id)}
          className="flex min-h-12 w-12 items-center justify-center border-l border-destructive/20 text-sm text-destructive"
          style={{ background: 'rgb(254 226 226)' }}
        >
          ✕
        </button>
      </div>

      {/* Collapsed: config summary tags */}
      {!expanded && (
        <div
          className="flex flex-wrap gap-1 px-3 pb-2 pt-1"
          style={{ background: colors.bg }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{
                background: colors.tagBg,
                color: colors.tagText,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expanded: inline form */}
      {expanded && (
        <div
          className="flex flex-col gap-3 p-3"
          style={{ background: colors.bg }}
        >
          <ConfigFormFields
            fields={configFields}
            config={editConfig}
            onChange={setEditConfig}
          />
          <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
            Bookmark name
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Save"
              onClick={() => void handleSave()}
              className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
            >
              Save
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={handleCancel}
              className="h-12 flex-1 rounded-xl border border-input bg-background text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
