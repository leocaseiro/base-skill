import { describe, expect, it, vi } from 'vitest';
import { flashBankTileRejectFeedback } from './bank-tile-reject-feedback';

const mockTriggerShake = vi.fn();

vi.mock('./Slot/slot-animations', () => ({
  triggerShake: (...args: unknown[]) => mockTriggerShake(...args),
}));

describe('flashBankTileRejectFeedback', () => {
  it('resolves bank button from data-tile-bank-hole and matches slot-style wrong treatment', () => {
    document.body.innerHTML = `
      <div class="relative">
        <div data-tile-bank-hole="t1"></div>
        <div class="absolute"><button type="button">A</button></div>
      </div>
    `;
    const btn = document.querySelector('button');
    expect(btn).not.toBeNull();

    flashBankTileRejectFeedback('t1');

    expect(mockTriggerShake).toHaveBeenCalledWith(btn);
    expect(btn!.style.borderWidth).toBe('2px');
    expect(btn!.style.borderStyle).toBe('solid');
    expect(btn!.style.boxShadow).toBe('none');
    expect(btn!.style.background).toBe('var(--skin-wrong-bg)');
    expect(btn!.style.borderColor).toBe('var(--skin-wrong-border)');
    expect(btn!.style.color).toBe('var(--skin-wrong-color)');
  });

  it('uses explicit element when provided', () => {
    document.body.innerHTML = '';
    const standalone = document.createElement('button');
    document.body.append(standalone);

    flashBankTileRejectFeedback('missing-id', { element: standalone });

    expect(mockTriggerShake).toHaveBeenCalledWith(standalone);
    expect(standalone.style.borderWidth).toBe('2px');
  });
});
