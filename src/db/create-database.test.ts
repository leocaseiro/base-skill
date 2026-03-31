import { afterEach, describe, expect, it } from 'vitest'
import { createTestDatabase, destroyTestDatabase } from './create-database'

describe('createTestDatabase', () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>> | undefined
  afterEach(async () => {
    if (db) await destroyTestDatabase(db)
    db = undefined
  })

  it('creates app_meta collection', async () => {
    db = await createTestDatabase()
    expect(db.app_meta).toBeDefined()
  })
})
