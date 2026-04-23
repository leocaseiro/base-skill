import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { draftStore } from './draftStore';
import type { DraftEntry } from '../types';

const sample = (
  word: string,
  overrides: Partial<DraftEntry> = {},
): Omit<DraftEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  word,
  region: 'aus',
  level: 3,
  ipa: 'pʊtɪŋ',
  syllables: ['put', 'ting'],
  syllableCount: 2,
  graphemes: [
    { g: 'p', p: 'p' },
    { g: 'u', p: 'ʊ' },
    { g: 'tt', p: 't' },
    { g: 'ing', p: 'ɪŋ' },
  ],
  ritaKnown: true,
  ...overrides,
});

beforeEach(async () => {
  await draftStore.__clearAllForTests();
});

afterEach(async () => {
  await draftStore.__clearAllForTests();
});

describe('draftStore CRUD', () => {
  it('saves and lists a draft', async () => {
    const saved = await draftStore.saveDraft(sample('putting'));
    expect(saved.id).toMatch(/.{10,}/);
    expect(saved.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const listed = await draftStore.listDrafts({ region: 'aus' });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.word).toBe('putting');
  });

  it('rejects duplicate [region, word]', async () => {
    await draftStore.saveDraft(sample('putting'));
    await expect(
      draftStore.saveDraft(sample('putting')),
    ).rejects.toThrow(/already exists/i);
  });

  it('updates an existing draft by id', async () => {
    const saved = await draftStore.saveDraft(sample('putting'));
    await new Promise((r) => setTimeout(r, 5));
    const updated = await draftStore.updateDraft(saved.id, {
      level: 4,
    });
    expect(updated.level).toBe(4);
    expect(updated.updatedAt).not.toBe(saved.updatedAt);
    expect(updated.createdAt).toBe(saved.createdAt);
  });

  it('deletes a draft', async () => {
    const saved = await draftStore.saveDraft(sample('putting'));
    await draftStore.deleteDraft(saved.id);
    expect(await draftStore.listDrafts({ region: 'aus' })).toEqual([]);
  });

  it('exports drafts in the canonical shape', async () => {
    await draftStore.saveDraft(sample('putting'));
    await draftStore.saveDraft(sample('should', { level: 4 }));

    const exported = await draftStore.exportDrafts();
    expect(exported.version).toBe(1);
    expect(exported.drafts).toHaveLength(2);
    for (const d of exported.drafts) {
      expect(d).not.toHaveProperty('id');
      expect(d).toHaveProperty('word');
      expect(d).toHaveProperty('graphemes');
    }
    expect(exported.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
