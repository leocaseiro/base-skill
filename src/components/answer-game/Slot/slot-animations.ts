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
 * Animates a tile sliding from its slot toward a target position,
 * then calls onComplete. Used for auto-eject return animation.
 */
export const triggerEjectReturn = (
  el: HTMLElement,
  targetEl: HTMLElement | null,
  onComplete: () => void,
): void => {
  if (!targetEl) {
    el.style.transition = 'opacity 300ms ease-in';
    el.style.opacity = '0';
    el.addEventListener(
      'transitionend',
      () => {
        el.style.removeProperty('transition');
        el.style.removeProperty('opacity');
        onComplete();
      },
      { once: true },
    );
    return;
  }

  const slotRect = el.getBoundingClientRect();
  const bankRect = targetEl.getBoundingClientRect();
  const deltaX =
    bankRect.left +
    bankRect.width / 2 -
    (slotRect.left + slotRect.width / 2);
  const deltaY =
    bankRect.top +
    bankRect.height / 2 -
    (slotRect.top + slotRect.height / 2);

  el.style.transition =
    'transform 300ms ease-in, opacity 300ms ease-in';
  el.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.8)`;
  el.style.opacity = '0.7';

  el.addEventListener(
    'transitionend',
    () => {
      el.style.removeProperty('transition');
      el.style.removeProperty('transform');
      el.style.removeProperty('opacity');
      onComplete();
    },
    { once: true },
  );
};
