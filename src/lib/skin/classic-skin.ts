import type { GameSkin } from './game-skin';

/**
 * Default skin — tokens reference existing `--bs-*` app theme values so
 * the engine's visual output is unchanged when no other skin is registered.
 */
export const classicSkin: GameSkin = {
  id: 'classic',
  name: 'Classic',
  tokens: {
    // Tile tokens
    '--skin-tile-bg': 'var(--bs-primary)',
    '--skin-tile-text': 'var(--bs-surface)',
    '--skin-tile-radius': '0.75rem',
    '--skin-tile-border': 'transparent',
    '--skin-tile-shadow': '0 2px 4px rgb(0 0 0 / 10%)',
    '--skin-tile-font-weight': '700',

    // Slot tokens
    '--skin-slot-bg': 'var(--bs-surface)',
    '--skin-slot-border': 'var(--bs-accent)',
    '--skin-slot-radius': '0.75rem',
    '--skin-slot-active-border': 'var(--bs-primary)',

    // Feedback tokens
    '--skin-correct-color': 'var(--bs-success)',
    '--skin-wrong-color': 'var(--bs-error)',
    '--skin-correct-animation': 'pop 250ms ease-out',
    '--skin-wrong-animation': 'shake 300ms ease-in-out',

    // Scene tokens
    '--skin-scene-bg': 'transparent',
    '--skin-bank-bg': 'transparent',
    '--skin-bank-border': 'transparent',

    // Celebration tokens
    '--skin-celebration-emoji': "'🐨'",
  },
};
