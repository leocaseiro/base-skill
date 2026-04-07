import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { triggerPop, triggerShake } from './slot-animations';

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
