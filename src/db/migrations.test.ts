import { afterEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  destroyTestDatabase,
} from './create-database';
import { ensureAppMetaSingleton } from './migrations';
import { MAX_SCHEMA_VERSION } from './schemas';

describe('migrations', () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
  afterEach(async () => {
    if (db) await destroyTestDatabase(db);
    db = undefined;
  });

  it('ensureAppMetaSingleton creates app_meta with MAX_SCHEMA_VERSION and installId', async () => {
    db = await createTestDatabase();
    await ensureAppMetaSingleton(db);
    const document_ = await db.app_meta.findOne('singleton').exec();
    expect(document_).not.toBeNull();
    expect(document_!.rxdbSchemaVersion).toBe(MAX_SCHEMA_VERSION);
    expect(document_!.installId.length).toBeGreaterThan(0);
  });
});
