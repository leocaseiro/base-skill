import type { RxJsonSchema } from 'rxdb'

export type ProfileDoc = {
  id: string
  name: string
  avatar?: string
  gradeLevel: 'pre-k' | 'k' | '1' | '2' | '3' | '4' | '5' | '6'
  language: string
  themeId?: string
  parentPinHash?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const profilesSchema: RxJsonSchema<ProfileDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string', minLength: 1, maxLength: 64 },
    avatar: { type: 'string' },
    gradeLevel: {
      type: 'string',
      enum: ['pre-k', 'k', '1', '2', '3', '4', '5', '6'],
    },
    language: { type: 'string' },
    themeId: { type: 'string' },
    parentPinHash: { type: 'string' },
    isActive: { type: 'boolean', default: false },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'gradeLevel', 'language', 'isActive', 'createdAt', 'updatedAt'],
  additionalProperties: false,
}
