import { describe, expect, it } from 'vitest';
import { directionLabel, inputMethodLabel } from './simple-labels';

describe('simple-labels', () => {
  it('returns kid-playful direction labels', () => {
    expect(directionLabel('ascending')).toMatchObject({
      emoji: '🚀',
      label: 'Going Up!',
      subtitle: 'ascending',
    });
    expect(directionLabel('descending')).toMatchObject({
      emoji: '🛝',
      label: 'Going Down!',
      subtitle: 'descending',
    });
  });

  it('returns kid-playful input-method labels', () => {
    expect(inputMethodLabel('drag')).toEqual({
      emoji: '✋',
      label: 'Drag',
    });
    expect(inputMethodLabel('type')).toEqual({
      emoji: '⌨️',
      label: 'Type',
    });
    expect(inputMethodLabel('both')).toEqual({
      emoji: '✨',
      label: 'Both',
    });
  });
});
