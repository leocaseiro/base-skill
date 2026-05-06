import { triggerShake } from './Slot/slot-animations';

/** Inline props games may set on bank tiles via React `style={tileStyle()}` / skin overrides. */
const INLINE_TILE_SNAPSHOT_KEYS = [
  'background',
  'boxShadow',
  'textShadow',
  'border',
  'borderWidth',
  'borderStyle',
  'borderColor',
  'borderRadius',
  'color',
  'opacity',
  'filter',
  'fontWeight',
] as const;

type InlineTileSnapshot = Record<
  (typeof INLINE_TILE_SNAPSHOT_KEYS)[number],
  string
>;

function snapshotInlineTileStyles(el: HTMLElement): InlineTileSnapshot {
  const s = el.style;
  const snap = {} as InlineTileSnapshot;
  for (const key of INLINE_TILE_SNAPSHOT_KEYS) {
    snap[key] = String(s[key as keyof CSSStyleDeclaration] ?? '');
  }
  return snap;
}

function restoreInlineTileStyles(
  el: HTMLElement,
  snap: InlineTileSnapshot,
): void {
  const styleObj = el.style as unknown as Record<string, string>;
  for (const key of INLINE_TILE_SNAPSHOT_KEYS) {
    styleObj[key] = snap[key];
  }
}

function resolveBankTileButton(tileId: string): HTMLElement | null {
  const escaped =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(tileId)
      : tileId.replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`);
  const hole = document.querySelector(
    `[data-tile-bank-hole="${escaped}"]`,
  );
  const btn = hole?.parentElement?.querySelector('button');
  return btn ?? null;
}

/**
 * Wrong-tile feedback on a bank tile: matches {@link Slot} wrong styling
 * (`border-2` weight + skin wrong tokens). Clears `tileStyle()` box-shadow for
 * the flash so the red border reads like the slot.
 *
 * Snapshots inline styles before mutating and restores them on `animationend`
 * so React's `style={tileStyle()}` is not left blank until the next render.
 */
export const flashBankTileRejectFeedback = (
  tileId: string,
  options?: {
    /** Prefer passing the dragged tile's button when available (touch path). */
    element?: HTMLElement | null;
    /** Runs after inline tile styles are restored (e.g. drop `data-shaking`). */
    onAnimationEnd?: () => void;
  },
): void => {
  const el = options?.element ?? resolveBankTileButton(tileId);
  if (!el) return;

  const priorInline = snapshotInlineTileStyles(el);

  triggerShake(el);

  el.style.borderWidth = '2px';
  el.style.borderStyle = 'solid';
  el.style.borderColor = 'var(--skin-wrong-border)';
  el.style.background = 'var(--skin-wrong-bg)';
  el.style.color = 'var(--skin-wrong-color)';
  el.style.boxShadow = 'none';

  el.addEventListener(
    'animationend',
    () => {
      restoreInlineTileStyles(el, priorInline);
      options?.onAnimationEnd?.();
    },
    { once: true },
  );
};
