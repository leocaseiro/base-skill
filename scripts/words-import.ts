import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { z } from 'zod';

const GraphemeSchema = z.object({
  g: z.string().min(1),
  p: z.string().min(1),
  span: z.tuple([z.number(), z.number()]).optional(),
});

const DraftSchema = z
  .object({
    word: z
      .string()
      .min(1)
      .regex(/^[a-z]+$/, 'word must be lowercase letters only'),
    region: z.literal('aus'),
    level: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
      z.literal(8),
    ]),
    ipa: z.string().min(1),
    syllables: z.array(z.string().min(1)).min(1),
    syllableCount: z.number().int().positive(),
    graphemes: z.array(GraphemeSchema).min(1),
    variants: z.array(z.string()).optional(),
    ritaKnown: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .superRefine((d, ctx) => {
    if (d.syllables.join('') !== d.word) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'syllables.join("") must equal word',
      });
    }
  });

const ExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  drafts: z.array(DraftSchema),
});

type Draft = z.infer<typeof DraftSchema>;

interface WordCoreLite {
  word: string;
  syllableCount: number;
  syllables?: string[];
  variants?: string[];
}

interface CurriculumEntryLite {
  word: string;
  level: number;
  ipa: string;
  graphemes: Draft['graphemes'];
}

const readJson = <T>(p: string): T =>
  JSON.parse(readFileSync(p, 'utf8')) as T;

const writeJson = (p: string, data: unknown): void => {
  writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
};

export interface ImportResult {
  imported: number;
  skipped: number;
  skips: string[];
}

export const importDraftsFromFile = async (
  draftsFile: string,
  { cwd = process.cwd() }: { cwd?: string } = {},
): Promise<ImportResult> => {
  let parsed: z.infer<typeof ExportSchema>;
  try {
    parsed = ExportSchema.parse(readJson(draftsFile));
  } catch (error) {
    throw new Error(
      `validation: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const result: ImportResult = { imported: 0, skipped: 0, skips: [] };

  const coreUpdates = new Map<number, WordCoreLite[]>();
  const curriculumUpdates = new Map<number, CurriculumEntryLite[]>();

  for (const d of parsed.drafts) {
    const corePath = path.join(
      cwd,
      `src/data/words/core/level${d.level}.json`,
    );
    const cPath = path.join(
      cwd,
      `src/data/words/curriculum/aus/level${d.level}.json`,
    );

    const core =
      coreUpdates.get(d.level) ?? readJson<WordCoreLite[]>(corePath);
    const curr =
      curriculumUpdates.get(d.level) ??
      readJson<CurriculumEntryLite[]>(cPath);

    if (core.some((w) => w.word === d.word)) {
      result.skipped += 1;
      result.skips.push(
        `skipped: ${d.word} already exists in core/level${d.level}.json`,
      );
      continue;
    }

    core.push({
      word: d.word,
      syllableCount: d.syllableCount,
      syllables: d.syllables,
      ...(d.variants ? { variants: d.variants } : {}),
    });
    core.sort((a, b) => a.word.localeCompare(b.word));

    curr.push({
      word: d.word,
      level: d.level,
      ipa: d.ipa,
      graphemes: d.graphemes,
    });
    curr.sort((a, b) => a.word.localeCompare(b.word));

    coreUpdates.set(d.level, core);
    curriculumUpdates.set(d.level, curr);
    result.imported += 1;
  }

  for (const [level, core] of coreUpdates) {
    writeJson(
      path.join(cwd, `src/data/words/core/level${level}.json`),
      core,
    );
  }
  for (const [level, curr] of curriculumUpdates) {
    writeJson(
      path.join(
        cwd,
        `src/data/words/curriculum/aus/level${level}.json`,
      ),
      curr,
    );
  }

  return result;
};

const main = async (): Promise<number> => {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: yarn words:import <path-to-export.json>');
    return 1;
  }
  try {
    const result = await importDraftsFromFile(arg);
    for (const s of result.skips) console.warn(`⚠ ${s}`);
    console.log(
      `\nImported ${result.imported} of ${
        result.imported + result.skipped
      } entries. Review with \`git diff\` before committing.`,
    );
    return result.skipped > 0 && result.imported === 0 ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 2;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await main();
  if (exitCode !== 0) {
    throw new Error(
      `words:import exited with code ${exitCode.toString()}`,
    );
  }
}
