import type { RxJsonSchema } from 'rxdb';

export type SyncMetaDoc = {
  id: string;
  provider: 'google-drive' | 'onedrive';
  deviceId: string;
  deviceName?: string;
  lastSyncAt?: string | null;
  checkpoint?: Record<string, unknown> | null;
  encryptedTokens?: string | null;
  status: 'not-configured' | 'active' | 'paused' | 'error';
};

export const syncMetaSchema: RxJsonSchema<SyncMetaDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    provider: { type: 'string', enum: ['google-drive', 'onedrive'] },
    deviceId: { type: 'string', maxLength: 64 },
    deviceName: { type: 'string', maxLength: 128 },
    lastSyncAt: {
      oneOf: [
        { type: 'string', format: 'date-time' },
        { type: 'null' },
      ],
    },
    checkpoint: {
      oneOf: [
        { type: 'object', additionalProperties: true },
        { type: 'null' },
      ],
    },
    encryptedTokens: {
      oneOf: [{ type: 'string' }, { type: 'null' }],
    },
    status: {
      type: 'string',
      enum: ['not-configured', 'active', 'paused', 'error'],
      default: 'not-configured',
    },
  },
  required: ['id', 'provider', 'deviceId', 'status'],
  additionalProperties: false,
};
