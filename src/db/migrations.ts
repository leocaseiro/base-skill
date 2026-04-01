import { nanoid } from 'nanoid';
import { MAX_SCHEMA_VERSION } from './schemas';
import type { BaseSkillDatabase } from './types';

function getAppVersion(): string {
  const v: string = import.meta.env.VITE_APP_VERSION;
  if (typeof v === 'string' && /^\d+\.\d+\.\d+$/.test(v)) {
    return v;
  }
  return '0.1.0';
}

export async function ensureAppMetaSingleton(
  db: BaseSkillDatabase,
): Promise<void> {
  const existing = await db.app_meta.findOne('singleton').exec();
  if (existing) {
    return;
  }
  await db.app_meta.insert({
    id: 'singleton',
    appVersion: getAppVersion(),
    rxdbSchemaVersion: MAX_SCHEMA_VERSION,
    lastMigrationAt: null,
    installId: `dev_${nanoid()}`,
  });
}

export async function checkVersionAndMigrate(
  db: BaseSkillDatabase,
): Promise<void> {
  await ensureAppMetaSingleton(db);
  const meta = await db.app_meta.findOne('singleton').exec();
  if (!meta) {
    return;
  }
  if (meta.rxdbSchemaVersion < MAX_SCHEMA_VERSION) {
    await meta.incrementalPatch({
      rxdbSchemaVersion: MAX_SCHEMA_VERSION,
      lastMigrationAt: new Date().toISOString(),
      appVersion: getAppVersion(),
    });
  }
}
