import type { RxJsonSchema } from 'rxdb'

export type SettingsDoc = {
  id: string
  profileId: string
  volume?: number
  speechRate?: number
  activeLanguage?: string
  ttsEnabled?: boolean
  showSubtitles?: boolean
  themeId?: string
  preferredVoiceURI?: string
  preferredVoiceDeviceId?: string
  updatedAt: string
}

export const settingsSchema: RxJsonSchema<SettingsDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    volume: { type: 'number', minimum: 0, maximum: 1, default: 0.8 },
    speechRate: { type: 'number', minimum: 0.5, maximum: 2.0, default: 1.0 },
    activeLanguage: { type: 'string' },
    ttsEnabled: { type: 'boolean', default: true },
    showSubtitles: { type: 'boolean', default: true },
    themeId: { type: 'string' },
    preferredVoiceURI: { type: 'string' },
    preferredVoiceDeviceId: { type: 'string' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'profileId', 'updatedAt'],
  additionalProperties: false,
}
