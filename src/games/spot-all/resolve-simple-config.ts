import { DEFAULT_ENABLED_FONT_IDS } from './visual-variation/pools';
import type { SpotAllConfig, SpotAllSimpleConfig } from './types';

export const resolveSimpleConfig = (
  simple: SpotAllSimpleConfig,
): SpotAllConfig => ({
  gameId: 'spot-all',
  component: 'SpotAll',
  configMode: 'simple',
  selectedConfusablePairs: simple.selectedConfusablePairs,
  selectedReversibleChars: simple.selectedReversibleChars,
  correctTileCount: 4,
  distractorCount: 4,
  totalRounds: 6,
  enabledFontIds: [...DEFAULT_ENABLED_FONT_IDS],
  roundsInOrder: false,
  ttsEnabled: true,
});
