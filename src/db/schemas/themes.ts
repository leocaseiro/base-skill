import type { RxJsonSchema } from 'rxdb';

export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
};

export type ThemeTypography = {
  fontFamily: string;
  baseSize: number;
};

export type ThemeDoc = {
  id: string;
  name: string;
  isPreset: boolean;
  ownedByProfileId?: string | null;
  ownedByFamily?: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  backgroundPattern?:
    | 'dots'
    | 'stars'
    | 'waves'
    | 'clouds'
    | 'none'
    | null;
  createdAt: string;
  updatedAt: string;
};

export const themesSchema: RxJsonSchema<ThemeDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    name: { type: 'string', minLength: 1, maxLength: 64 },
    isPreset: { type: 'boolean', default: false },
    ownedByProfileId: {
      oneOf: [{ type: 'string' }, { type: 'null' }],
    },
    ownedByFamily: { type: 'boolean', default: false },
    colors: {
      type: 'object',
      properties: {
        primary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        secondary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        background: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        surface: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        text: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        accent: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
      },
      required: [
        'primary',
        'secondary',
        'background',
        'surface',
        'text',
        'accent',
      ],
      additionalProperties: false,
    },
    typography: {
      type: 'object',
      properties: {
        fontFamily: { type: 'string' },
        baseSize: { type: 'number', minimum: 12, maximum: 32 },
      },
      required: ['fontFamily', 'baseSize'],
      additionalProperties: false,
    },
    backgroundPattern: {
      oneOf: [
        {
          type: 'string',
          enum: ['dots', 'stars', 'waves', 'clouds', 'none'],
        },
        { type: 'null' },
      ],
      default: 'none',
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: [
    'id',
    'name',
    'isPreset',
    'colors',
    'typography',
    'createdAt',
    'updatedAt',
  ],
  additionalProperties: false,
};
