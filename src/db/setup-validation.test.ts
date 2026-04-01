import { describe, expect, it } from 'vitest';

describe('test environment', () => {
  it('indexedDB is available', () => {
    expect(indexedDB).toBeDefined();
  });
});
