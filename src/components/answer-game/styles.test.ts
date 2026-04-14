import { describe, expect, it } from 'vitest';
import { tileStyle } from './styles';

describe('tileStyle', () => {
  it('returns a style object that references --skin-tile-* tokens', () => {
    const style = tileStyle();
    expect(style.background).toContain('var(--skin-tile-surface');
    expect(style.background).toContain('var(--skin-tile-highlight');
    expect(style.boxShadow).toContain('var(--skin-tile-ring');
    expect(style.boxShadow).toContain('var(--skin-tile-inset-bottom');
    expect(style.boxShadow).toContain('var(--skin-tile-inset-top');
    expect(style.textShadow).toContain('var(--skin-tile-text-shadow');
  });
});
