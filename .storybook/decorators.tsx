import type { Decorator } from '@storybook/react';
import type { CSSProperties } from 'react';
import { classicSkin } from '@/lib/skin';

/**
 * Wraps every story in a `game-container skin-classic` div with classicSkin
 * tokens applied inline. Components that expect `--skin-*` custom properties
 * (tiles, slots, HUD, etc.) render with sensible defaults without each story
 * having to re-declare the wrapper.
 *
 * Games that mount their own `game-container skin-${skin.id}` wrapper (e.g.
 * SortNumbers, NumberMatch, WordSpell) naturally override these defaults via
 * CSS custom property cascade on the inner wrapper — no opt-out needed.
 */
export const withDefaultSkin: Decorator = (Story) => (
  <div
    className={`game-container skin-${classicSkin.id}`}
    style={classicSkin.tokens as CSSProperties}
  >
    <Story />
  </div>
);
