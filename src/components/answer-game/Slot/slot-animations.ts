/** Adds animate-shake class, removes it on animationend. */
export const triggerShake = (el: HTMLElement): void => {
  el.classList.remove('animate-shake');
  // Force reflow to restart animation if already running
  void el.offsetWidth;
  el.classList.add('animate-shake');
  el.addEventListener(
    'animationend',
    () => el.classList.remove('animate-shake'),
    { once: true },
  );
};

/** Adds animate-pop class, removes it on animationend. */
export const triggerPop = (el: HTMLElement): void => {
  el.classList.remove('animate-pop');
  void el.offsetWidth;
  el.classList.add('animate-pop');
  el.addEventListener(
    'animationend',
    () => el.classList.remove('animate-pop'),
    { once: true },
  );
};

/**
 * Animates a tile flying from its slot toward the tile bank.
 *
 * Phase 1: ghost flies to the hole (transform only, no opacity change).
 * Phase 2: ghost fades out — but only when the caller invokes `startFade()`.
 *          This lets the caller wait until the real tile has appeared in the
 *          bank (i.e. after EJECT_TILE fires) before fading the ghost out,
 *          preventing a visible gap between ghost disappearing and tile appearing.
 *
 * Returns { startFade } — call it when the bank tile is ready to be shown.
 * If startFade is called before phase 1 completes, the fade starts immediately
 * after the ghost arrives. Calling it multiple times is a no-op.
 *
 * el is the button inside the slot. We use its parent (the slot li) for
 * accurate pixel dimensions and border-radius, then build a fresh fixed-
 * position ghost div so the animation escapes overflow:hidden ancestors
 * and avoids size-full / percentage class conflicts.
 */
export const triggerEjectReturn = (
  el: HTMLElement,
  tileId: string | null,
  onComplete: () => void,
): { startFade: () => void } => {
  // Slot element gives us correct size + border-radius (button has size-full %).
  const sourceEl = el.parentElement ?? el;
  const sourceRect = sourceEl.getBoundingClientRect();
  const sourceCs = globalThis.getComputedStyle(sourceEl);
  // jsdom returns empty for unstyled elements; cssText drops declarations
  // with empty values, so fall back to '0' which is valid CSS.
  const borderRadius = sourceCs.borderRadius || '0';
  // Inherit the live tile background + shadow so skinned tiles (e.g. transparent
  // stone tiles) don't flash their classic-default white card mid-flight.
  // No fallback shadow when source has one — when source has none (e.g.
  // dragon-cave's transparent stone), a default rect shadow would trace the
  // ghost's rounded-rect outline and look like a phantom square. Skinned
  // tiles that want lift during drag should apply filter: drop-shadow on
  // their decoration so it follows the actual shape. Empty-string fallbacks
  // are needed because jsdom returns '' from getComputedStyle on detached/
  // unstyled elements, and an empty value in cssText would silently drop the
  // whole declaration block (breaking the position: fixed lookup tests do).
  const buttonCs = globalThis.getComputedStyle(el);
  const ghostBg = buttonCs.background || 'transparent';
  const ghostShadow = buttonCs.boxShadow || 'none';
  // Effective parent transform scale (e.g. dragon-cave container scales its
  // descendants via transform: scale(...) so layout dimensions and visual
  // dimensions diverge). The ghost is appended to document.body and inherits
  // none of that transform, so the cloned letter renders at its raw layout
  // font-size — which looks too big on small screens and too small on big
  // screens. Compensate by scaling the ghost's font-size back to match the
  // source's effective visual size.
  const visualScale =
    sourceEl.offsetWidth > 0
      ? sourceRect.width / sourceEl.offsetWidth
      : 1;
  const sourceFontSizePx = Number.parseFloat(buttonCs.fontSize) || 0;
  const ghostFontSize = `${sourceFontSizePx * visualScale || 0}px`;

  // Fresh div — no inherited classes that could break fixed positioning.
  // Set properties one by one (not via cssText) so a single bad value
  // doesn't drop the whole declaration block — jsdom in particular can
  // serialize getComputedStyle results in ways that break cssText parsing.
  const ghost = document.createElement('div');
  ghost.innerHTML = el.innerHTML;
  Object.assign(ghost.style, {
    position: 'fixed',
    top: `${sourceRect.top}px`,
    left: `${sourceRect.left}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    fontSize: ghostFontSize,
    borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: ghostBg,
    boxShadow: ghostShadow,
    zIndex: '9999',
    pointerEvents: 'none',
    margin: '0',
  });
  document.body.append(ghost);

  // Hide the original so only the ghost is visible during the flight.
  el.style.opacity = '0';

  const cleanup = () => {
    ghost.remove();
    el.style.opacity = '';
    onComplete();
  };

  // Look up the specific hole for this tile, or fall back to the bank container.
  const targetEl = tileId
    ? document.querySelector<HTMLElement>(
        `[data-tile-bank-hole="${tileId}"]`,
      )
    : document.querySelector<HTMLElement>('[data-tile-bank]');

  // startFade state machine: phase-1 may complete before or after the caller
  // triggers the fade, so we track both independently.
  let fadeRequested = false;
  let phaseOneDone = false;

  const doFade = () => {
    ghost.style.transition = 'opacity 200ms ease-out';
    void ghost.offsetWidth;
    ghost.style.opacity = '0';
    ghost.addEventListener('transitionend', cleanup, { once: true });
  };

  const startFade = () => {
    if (fadeRequested) return; // idempotent
    fadeRequested = true;
    if (phaseOneDone) doFade();
  };

  if (!targetEl) {
    // No target — fade in place immediately (no hole to fly to).
    ghost.style.transition = 'opacity 300ms ease-in';
    void ghost.offsetWidth;
    ghost.style.opacity = '0';
    ghost.addEventListener('transitionend', cleanup, { once: true });
    return { startFade };
  }

  const bankRect = targetEl.getBoundingClientRect();
  const deltaX =
    bankRect.left +
    bankRect.width / 2 -
    (sourceRect.left + sourceRect.width / 2);
  const deltaY =
    bankRect.top +
    bankRect.height / 2 -
    (sourceRect.top + sourceRect.height / 2);

  // Phase 1: fly to the hole (no opacity change during flight).
  ghost.style.transition = 'transform 300ms ease-in';
  void ghost.offsetWidth;
  ghost.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

  ghost.addEventListener(
    'transitionend',
    () => {
      phaseOneDone = true;
      if (fadeRequested) doFade();
      // Otherwise ghost waits at hole until startFade() is called.
    },
    { once: true },
  );

  return { startFade };
};
