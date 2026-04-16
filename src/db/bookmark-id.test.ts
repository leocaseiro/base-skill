import { describe, expect, it } from 'vitest';
import { bookmarkId, parseBookmarkId } from './bookmark-id';

describe('bookmarkId', () => {
  it('builds a composite id from profile + targetType + targetId', () => {
    expect(bookmarkId('anonymous', 'game', 'word-spell')).toBe(
      'anonymous:game:word-spell',
    );
    expect(bookmarkId('anonymous', 'customGame', 'cg_abc123')).toBe(
      'anonymous:customGame:cg_abc123',
    );
  });
});

describe('parseBookmarkId', () => {
  it('inverts bookmarkId for game targets', () => {
    expect(parseBookmarkId('anonymous:game:word-spell')).toEqual({
      profileId: 'anonymous',
      targetType: 'game',
      targetId: 'word-spell',
    });
  });

  it('inverts bookmarkId for customGame targets with colons in the id', () => {
    expect(parseBookmarkId('anonymous:customGame:cg:abc:123')).toEqual({
      profileId: 'anonymous',
      targetType: 'customGame',
      targetId: 'cg:abc:123',
    });
  });

  it('returns null for malformed ids', () => {
    expect(parseBookmarkId('not-a-bookmark')).toBeNull();
    expect(parseBookmarkId('anonymous:invalidType:x')).toBeNull();
  });
});
