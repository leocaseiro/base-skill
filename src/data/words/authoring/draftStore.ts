import Dexie from 'dexie';
import { nanoid } from 'nanoid';
import type { DraftEntry, Region } from '../types';
import type { Table } from 'dexie';

const DB_NAME = 'basekill-word-drafts';

class DraftDB extends Dexie {
  drafts!: Table<DraftEntry, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      drafts: 'id, &[region+word], [region+level]',
    });
  }
}

const db = new DraftDB();

export interface ExportedDraft extends Omit<DraftEntry, 'id'> {}

export interface DraftsExport {
  version: 1;
  exportedAt: string;
  drafts: ExportedDraft[];
}

const nowIso = (): string => new Date().toISOString();

const omitId = (d: DraftEntry): ExportedDraft => {
  const { id: _id, ...rest } = d;
  return rest;
};

export const draftStore = {
  async saveDraft(
    input: Omit<DraftEntry, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DraftEntry> {
    const existing = await db.drafts
      .where('[region+word]')
      .equals([input.region, input.word])
      .first();
    if (existing) {
      throw new Error(
        `draft for "${input.word}" (${input.region}) already exists`,
      );
    }
    const now = nowIso();
    const entry: DraftEntry = {
      id: nanoid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    await db.drafts.add(entry);
    return entry;
  },

  async updateDraft(
    id: string,
    patch: Partial<
      Omit<DraftEntry, 'id' | 'createdAt' | 'region' | 'word'>
    >,
  ): Promise<DraftEntry> {
    const current = await db.drafts.get(id);
    if (!current) throw new Error(`draft not found: ${id}`);
    const next: DraftEntry = {
      ...current,
      ...patch,
      updatedAt: nowIso(),
    };
    await db.drafts.put(next);
    return next;
  },

  async deleteDraft(id: string): Promise<void> {
    await db.drafts.delete(id);
  },

  async listDrafts(opts: { region: Region }): Promise<DraftEntry[]> {
    return db.drafts
      .where('[region+word]')
      .between([opts.region, ''], [opts.region, '￿'])
      .toArray();
  },

  async exportDrafts(): Promise<DraftsExport> {
    const all = await db.drafts.toArray();
    return {
      version: 1,
      exportedAt: nowIso(),
      drafts: all.map((d) => omitId(d)),
    };
  },

  async __clearAllForTests(): Promise<void> {
    await db.drafts.clear();
  },
};
