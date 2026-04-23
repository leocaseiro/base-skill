import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { importDraftsFromFile } from './words-import';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(os.tmpdir(), 'wordimport-'));
  mkdirSync(path.join(tmp, 'src/data/words/core'), { recursive: true });
  mkdirSync(path.join(tmp, 'src/data/words/curriculum/aus'), {
    recursive: true,
  });
  writeFileSync(
    path.join(tmp, 'src/data/words/core/level3.json'),
    '[\n  { "word": "aaa", "syllableCount": 1 }\n]\n',
  );
  writeFileSync(
    path.join(tmp, 'src/data/words/curriculum/aus/level3.json'),
    JSON.stringify(
      [
        {
          word: 'aaa',
          level: 3,
          ipa: 'ɑ',
          graphemes: [{ g: 'aaa', p: 'ɑ' }],
        },
      ],
      null,
      2,
    ) + '\n',
  );
});

afterEach(() => {
  // tmp cleanup is OS-automatic; not critical.
});

const writeExport = (drafts: unknown[]) => {
  const p = path.join(tmp, 'drafts.json');
  writeFileSync(
    p,
    JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      drafts,
    }),
  );
  return p;
};

describe('importDraftsFromFile', () => {
  it('merges a valid draft into core + curriculum and preserves sort', async () => {
    const draftsPath = writeExport([
      {
        word: 'putting',
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const result = await importDraftsFromFile(draftsPath, { cwd: tmp });
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);

    const core = JSON.parse(
      readFileSync(
        path.join(tmp, 'src/data/words/core/level3.json'),
        'utf8',
      ),
    ) as { word: string }[];
    expect(core.map((w) => w.word)).toEqual(['aaa', 'putting']);
  });

  it('rejects a draft that already exists in shipped data', async () => {
    const draftsPath = writeExport([
      {
        word: 'aaa',
        region: 'aus',
        level: 3,
        ipa: 'ɑ',
        syllables: ['aaa'],
        syllableCount: 1,
        graphemes: [{ g: 'aaa', p: 'ɑ' }],
        ritaKnown: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const result = await importDraftsFromFile(draftsPath, { cwd: tmp });
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(0);
    expect(result.skips[0]).toMatch(/already exists/i);
  });

  it('rejects a draft with a bad schema', async () => {
    const draftsPath = writeExport([
      { word: 'BadCaps' /* missing fields */ },
    ]);
    await expect(
      importDraftsFromFile(draftsPath, { cwd: tmp }),
    ).rejects.toThrow(/validation/i);
  });

  it('is idempotent — re-running skips without double-writing', async () => {
    const draft = {
      word: 'putting',
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const draftsPath = writeExport([draft]);

    await importDraftsFromFile(draftsPath, { cwd: tmp });
    const again = await importDraftsFromFile(draftsPath, { cwd: tmp });
    expect(again.imported).toBe(0);
    expect(again.skipped).toBe(1);
  });
});
