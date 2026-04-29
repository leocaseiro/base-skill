import { describe, expect, it } from 'vitest';
import { resolveSimpleConfig } from './resolve-simple-config';

describe('resolveSimpleConfig', () => {
  it('maps easy preset to small mirror-focused config', () => {
    const config = resolveSimpleConfig({
      configMode: 'simple',
      difficulty: 'easy',
    });
    expect(config.targetSetIds).toEqual(['bdpq']);
    expect(config.correctTileCount).toBe(4);
    expect(config.distractorCount).toBe(2);
  });

  it('maps hard preset to mixed relationship config', () => {
    const config = resolveSimpleConfig({
      configMode: 'simple',
      difficulty: 'hard',
    });
    expect(config.targetSetIds.length).toBeGreaterThan(3);
    expect(config.relationshipTypes).toContain('transposition');
    expect(config.distractorCount).toBeGreaterThan(
      config.correctTileCount,
    );
  });

  it('defaults medium behavior for unknown difficulty through caller fallback', () => {
    const config = resolveSimpleConfig({
      configMode: 'simple',
      difficulty: 'medium',
    });
    expect(config.targetSetIds.length).toBeGreaterThan(1);
    expect(config.relationshipTypes).toContain('visual-similarity');
  });
});
