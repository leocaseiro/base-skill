import { describe, expect, it } from 'vitest';
import { resolveSimpleConfig } from './resolve-simple-config';
import { DEFAULT_ENABLED_FONT_IDS } from './visual-variation/pools';

describe('resolveSimpleConfig', () => {
  it('produces a SpotAllConfig from selected pairs/reversibles', () => {
    const cfg = resolveSimpleConfig({
      configMode: 'simple',
      selectedConfusablePairs: [
        { pair: ['b', 'd'], type: 'mirror-horizontal' },
      ],
      selectedReversibleChars: ['2'],
    });
    expect(cfg.gameId).toBe('spot-all');
    expect(cfg.configMode).toBe('simple');
    expect(cfg.selectedConfusablePairs).toEqual([
      { pair: ['b', 'd'], type: 'mirror-horizontal' },
    ]);
    expect(cfg.selectedReversibleChars).toEqual(['2']);
  });

  it('defaults: 4 correct, 4 distractors, 6 rounds, all fonts enabled', () => {
    const cfg = resolveSimpleConfig({
      configMode: 'simple',
      selectedConfusablePairs: [],
      selectedReversibleChars: [],
    });
    expect(cfg.correctTileCount).toBe(4);
    expect(cfg.distractorCount).toBe(4);
    expect(cfg.totalRounds).toBe(6);
    expect(cfg.enabledFontIds).toEqual([...DEFAULT_ENABLED_FONT_IDS]);
    expect(cfg.roundsInOrder).toBe(false);
    expect(cfg.ttsEnabled).toBe(true);
  });
});
