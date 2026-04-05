// src/lib/config-tags.test.ts
import { describe, expect, it } from 'vitest';
import { configToTags } from './config-tags';

describe('configToTags', () => {
  it('returns inputMethod as-is', () => {
    expect(configToTags({ inputMethod: 'drag' })).toContain('drag');
  });

  it('formats totalRounds with "rounds" suffix', () => {
    expect(configToTags({ totalRounds: 8 })).toContain('8 rounds');
  });

  it('returns "TTS on" when ttsEnabled is true', () => {
    expect(configToTags({ ttsEnabled: true })).toContain('TTS on');
  });

  it('omits ttsEnabled tag when false', () => {
    expect(configToTags({ ttsEnabled: false })).not.toContain('TTS on');
  });

  it('caps output at 4 tags', () => {
    const config = {
      inputMethod: 'drag',
      totalRounds: 8,
      mode: 'picture',
      tileUnit: 'letter',
      ttsEnabled: true,
    };
    expect(configToTags(config).length).toBeLessThanOrEqual(4);
  });

  it('ignores unknown keys', () => {
    expect(configToTags({ unknownKey: 'foo' })).toEqual([]);
  });
});
