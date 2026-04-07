import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  triggerEjectReturn,
  triggerPop,
  triggerShake,
} from './slot-animations';

describe('triggerShake', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.append(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('adds animate-shake class', () => {
    triggerShake(el);
    expect(el.classList.contains('animate-shake')).toBe(true);
  });

  it('removes class on animationend', () => {
    triggerShake(el);
    el.dispatchEvent(new Event('animationend'));
    expect(el.classList.contains('animate-shake')).toBe(false);
  });
});

describe('triggerPop', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.append(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('adds animate-pop class', () => {
    triggerPop(el);
    expect(el.classList.contains('animate-pop')).toBe(true);
  });

  it('removes class on animationend', () => {
    triggerPop(el);
    el.dispatchEvent(new Event('animationend'));
    expect(el.classList.contains('animate-pop')).toBe(false);
  });
});

describe('triggerEjectReturn', () => {
  let el: HTMLDivElement;
  let slot: HTMLLIElement;

  beforeEach(() => {
    slot = document.createElement('li');
    el = document.createElement('div');
    slot.append(el);
    document.body.append(slot);
  });

  afterEach(() => {
    slot.remove();
    for (const node of document.querySelectorAll('[data-tile-bank]'))
      node.remove();
    for (const node of document.querySelectorAll(
      '[data-tile-bank-hole]',
    ))
      node.remove();
    // Remove any lingering ghost divs left by tests that never fire transitionend.
    for (const node of document.querySelectorAll(
      'div[style*="position: fixed"]',
    ))
      node.remove();
  });

  it('falls back to [data-tile-bank] when tileId is null', () => {
    const bank = document.createElement('div');
    bank.dataset.tileBank = '';
    document.body.append(bank);

    const onComplete = vi.fn();
    triggerEjectReturn(el, null, onComplete);

    const ghost = document.body.querySelector(
      'div[style*="position: fixed"]',
    );
    expect(ghost).not.toBeNull();
  });

  it('fades ghost out when no target element is found', () => {
    const onComplete = vi.fn();
    triggerEjectReturn(el, 'nonexistent-tile', onComplete);

    const ghost = document.body.querySelector(
      'div[style*="position: fixed"]',
    );
    expect(ghost).not.toBeNull();
    expect(ghost?.style.transition).toContain('opacity 300ms ease-in');
  });

  it('animates ghost to target hole, calls onComplete and removes ghost after two-phase transition', () => {
    const hole = document.createElement('div');
    hole.dataset.tileBankHole = 'tile-abc';
    document.body.append(hole);

    const onComplete = vi.fn();
    triggerEjectReturn(el, 'tile-abc', onComplete);

    const ghost = document.body.querySelector(
      'div[style*="position: fixed"]',
    );
    expect(ghost).not.toBeNull();
    // Phase 1: fly to hole (transform only, no opacity change during flight)
    expect(ghost?.style.transition).toContain(
      'transform 300ms ease-in',
    );
    expect(ghost?.style.transition).not.toContain('opacity');

    // End of phase 1: arrive at hole
    ghost?.dispatchEvent(new TransitionEvent('transitionend'));
    expect(onComplete).not.toHaveBeenCalled();

    // Phase 2: fade out at the hole
    expect(ghost?.style.transition).toContain('opacity 200ms ease-out');

    // End of phase 2: ghost removed, onComplete called
    ghost?.dispatchEvent(new TransitionEvent('transitionend'));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(document.body.contains(ghost)).toBe(false);
  });
});
