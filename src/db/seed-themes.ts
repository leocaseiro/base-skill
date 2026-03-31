import type { BaseSkillDatabase } from './types'
import type { ThemeDoc } from './schemas/themes'

const OCEAN_ID = 'theme_ocean_preset'
const FOREST_ID = 'theme_forest_preset'

const now = '2024-01-01T00:00:00.000Z'

const oceanPreset: ThemeDoc = {
  id: OCEAN_ID,
  name: 'Ocean',
  isPreset: true,
  ownedByProfileId: null,
  ownedByFamily: false,
  colors: {
    primary: '#0077B6',
    secondary: '#00B4D8',
    background: '#CAF0F8',
    surface: '#FFFFFF',
    text: '#03045E',
    accent: '#F77F00',
  },
  typography: { fontFamily: 'Edu NSW ACT Foundation', baseSize: 18 },
  backgroundPattern: 'waves',
  createdAt: now,
  updatedAt: now,
}

const forestPreset: ThemeDoc = {
  id: FOREST_ID,
  name: 'Forest',
  isPreset: true,
  ownedByProfileId: null,
  ownedByFamily: false,
  colors: {
    primary: '#2D6A4F',
    secondary: '#52B788',
    background: '#F0F7F0',
    surface: '#FFFFFF',
    text: '#1A3A2A',
    accent: '#D4A017',
  },
  typography: { fontFamily: 'Nunito', baseSize: 18 },
  backgroundPattern: 'dots',
  createdAt: now,
  updatedAt: now,
}

/** Inserts the two M2 preset themes if missing (stable ids). */
export async function seedThemesOnce(db: BaseSkillDatabase): Promise<void> {
  for (const doc of [oceanPreset, forestPreset]) {
    const existing = await db.themes.findOne(doc.id).exec()
    if (!existing) {
      await db.themes.insert(doc)
    }
  }
}
