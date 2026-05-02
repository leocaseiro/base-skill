import type { RxJsonSchema } from 'rxdb';

export type SettingsDoc = {
  id: string;
  profileId: string;
  volume?: number;
  speechRate?: number;
  activeLanguage?: string;
  ttsEnabled?: boolean;
  showSubtitles?: boolean;
  themeId?: string;
  preferredVoiceURI?: string;
  preferredVoiceDeviceId?: string;
  tapForgivenessThreshold?: number;
  updatedAt: string;
};

export const settingsSchema: RxJsonSchema<SettingsDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    volume: { type: 'number', minimum: 0, maximum: 1, default: 0.8 },
    speechRate: {
      type: 'number',
      minimum: 0.5,
      maximum: 2,
      default: 1,
    },
    activeLanguage: { type: 'string' },
    ttsEnabled: { type: 'boolean', default: true },
    showSubtitles: { type: 'boolean', default: true },
    themeId: { type: 'string' },
    preferredVoiceURI: { type: 'string' },
    preferredVoiceDeviceId: { type: 'string' },
    tapForgivenessThreshold: {
      type: 'number',
      minimum: 8,
      maximum: 60,
      default: 20,
    },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'profileId', 'updatedAt'],
  additionalProperties: false,
};
