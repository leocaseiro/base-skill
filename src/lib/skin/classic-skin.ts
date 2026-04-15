import type { GameSkin } from './game-skin';

/**
 * Default skin — tokens reference existing `--bs-*` app theme values so
 * the engine's visual output is unchanged when no other skin is registered.
 */
export const classicSkin: GameSkin = {
  id: 'classic',
  name: 'Classic',
  tokens: {
    // ── Tile tokens ───────────────────────────────────────────────
    '--skin-tile-bg': 'var(--bs-primary)',
    '--skin-tile-text': 'var(--bs-surface)',
    '--skin-tile-radius': '0.75rem',
    '--skin-tile-border': 'transparent',
    '--skin-tile-shadow': '0 2px 4px rgb(0 0 0 / 10%)',
    '--skin-tile-font-weight': '700',

    // ── Tile surface / skeuo tokens (replaces --skeuo-* / --card) ──
    '--skin-tile-surface': 'var(--card, #FAFAFA)',
    '--skin-tile-highlight': 'rgba(255,255,255,1)',
    '--skin-tile-ring': 'rgba(0,0,0,0.08)',
    '--skin-tile-inset-bottom': 'rgba(0,0,0,0.08)',
    '--skin-tile-inset-top': 'rgba(255,255,255,0.5)',
    '--skin-tile-text-shadow': 'rgba(0,0,0,0.12)',
    '--skin-tile-active-scale': '0.95',

    // ── Slot tokens ───────────────────────────────────────────────
    '--skin-slot-bg': 'var(--bs-surface)',
    '--skin-slot-border': 'var(--bs-accent)',
    '--skin-slot-radius': '0.75rem',
    '--skin-slot-active-border': 'var(--bs-primary)',

    // ── State tokens (replaces Tailwind state classes) ────────────
    '--skin-correct-bg': 'rgb(from var(--primary) r g b / 0.1)',
    '--skin-correct-border': 'var(--bs-primary)',
    '--skin-wrong-bg': 'rgb(from var(--destructive) r g b / 0.1)',
    '--skin-wrong-border': 'var(--destructive)',

    // ── Bank-hole tokens ──────────────────────────────────────────
    '--skin-bank-hole-bg': 'rgb(from var(--muted) r g b / 0.6)',
    '--skin-bank-hole-shadow': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

    // ── Hover-preview tokens ──────────────────────────────────────
    '--skin-hover-border-color': 'var(--bs-primary)',
    '--skin-hover-border-style': 'dashed',

    // ── Feedback animations ───────────────────────────────────────
    '--skin-correct-color': 'var(--bs-success)',
    '--skin-wrong-color': 'var(--bs-error)',
    '--skin-correct-animation': 'pop 250ms ease-out',
    '--skin-wrong-animation': 'shake 300ms ease-in-out',

    // ── Scene / bank container tokens ─────────────────────────────
    '--skin-scene-bg': 'transparent',
    '--skin-bank-bg': 'transparent',
    '--skin-bank-border': 'transparent',

    // ── Celebration tokens ────────────────────────────────────────
    '--skin-celebration-emoji': "'🐨'",

    // ── Question component tokens ─────────────────────────────────
    '--skin-question-bg': 'transparent',
    '--skin-question-text': 'inherit',
    '--skin-question-radius': '0.75rem',
    '--skin-question-audio-bg': 'var(--bs-primary)',
    '--skin-question-audio-fg': 'var(--primary-foreground)',
    '--skin-question-dot-bg': 'var(--bs-primary)',
    '--skin-question-dot-assigned-bg': 'var(--bs-primary)',

    // ── Sentence-with-gaps tokens ─────────────────────────────────
    '--skin-sentence-gap-border': 'currentColor',
    '--skin-sentence-gap-style': 'dashed',

    // ── Domino pip tokens ─────────────────────────────────────────
    '--skin-pip-color': 'currentColor',
    '--skin-pip-divider-color': 'currentColor',
    '--skin-pip-divider-opacity': '0.3',

    // ── HUD tokens ────────────────────────────────────────────────
    '--skin-hud-bg': 'transparent',
    '--skin-hud-gap': '0.5rem',
    '--skin-hud-padding': '0.25rem 0.75rem',
    '--skin-hud-radius': '9999px',
    '--skin-hud-dot-size': '0.875rem',
    '--skin-hud-dot-fill': 'var(--bs-primary)',
    '--skin-hud-dot-empty': 'var(--bs-surface)',
    '--skin-hud-dot-border': 'var(--bs-border)',
    '--skin-hud-dot-current-border': 'var(--skin-slot-border)',
    '--skin-hud-fraction-color': 'var(--bs-foreground)',
    '--skin-hud-fraction-sep-color': 'var(--skin-hud-dot-fill)',
    '--skin-hud-level-color': 'var(--bs-primary)',
  },
};
