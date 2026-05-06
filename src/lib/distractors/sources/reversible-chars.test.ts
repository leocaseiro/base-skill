import { describe, expect, it } from 'vitest';
import { reversibleCharsSource } from './reversible-chars';

describe('reversibleCharsSource', () => {
  it('returns the target character + scaleX(-1) for a selected mirror-horizontal target', () => {
    expect(
      reversibleCharsSource.getCandidates('2', {
        selectedReversibleChars: ['2', '6', '9'],
      }),
    ).toEqual([
      {
        label: '2',
        transform: 'scaleX(-1)',
        sourceId: 'reversible-chars',
        meta: { reversalTransform: 'mirror-horizontal' },
      },
    ]);
  });

  it('returns [] when target is not in the selection', () => {
    expect(
      reversibleCharsSource.getCandidates('2', {
        selectedReversibleChars: ['6'],
      }),
    ).toEqual([]);
  });

  it('returns [] when target is not a known reversible char', () => {
    expect(
      reversibleCharsSource.getCandidates('b', {
        selectedReversibleChars: ['b'],
      }),
    ).toEqual([]);
  });

  it('returns [] when selection is undefined', () => {
    expect(reversibleCharsSource.getCandidates('2', {})).toEqual([]);
  });
});
