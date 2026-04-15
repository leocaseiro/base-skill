import { describe, expect, it } from 'vitest';
import { resolveCover } from './cover';

describe('resolveCover', () => {
  it('returns the document cover when set', () => {
    const doc = {
      cover: { kind: 'emoji' as const, emoji: '🦁' },
    };
    const cover = resolveCover(doc, 'word-spell');
    expect(cover).toEqual({ kind: 'emoji', emoji: '🦁' });
  });

  it('falls back to the game default when doc cover is absent', () => {
    const cover = resolveCover({}, 'word-spell');
    expect(cover.kind).toBe('emoji');
    if (cover.kind === 'emoji') {
      expect(cover.emoji).toBe('🔤');
    }
  });

  it('throws when gameId is unknown and no doc cover', () => {
    expect(() => resolveCover({}, 'no-such-game')).toThrow(
      /unknown gameId/i,
    );
  });
});
