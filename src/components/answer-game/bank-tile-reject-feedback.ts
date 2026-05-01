import { triggerShake } from './Slot/slot-animations';

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
 */
export const flashBankTileRejectFeedback = (
  tileId: string,
  options?: {
    /** Prefer passing the dragged tile's button when available (touch path). */
    element?: HTMLElement | null;
    /** Runs after inline styles are cleared (e.g. drop `data-shaking`). */
    onAnimationEnd?: () => void;
  },
): void => {
  const el = options?.element ?? resolveBankTileButton(tileId);
  if (!el) return;

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
      el.style.borderWidth = '';
      el.style.borderStyle = '';
      el.style.borderColor = '';
      el.style.background = '';
      el.style.color = '';
      el.style.boxShadow = '';
      options?.onAnimationEnd?.();
    },
    { once: true },
  );
};
