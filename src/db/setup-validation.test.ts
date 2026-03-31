import { describe, it, expect } from 'vitest'

describe('test environment', () => {
  it('indexedDB is available', () => {
    expect(indexedDB).toBeDefined()
  })
})
