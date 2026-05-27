import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getConsent, setConsent, subscribeConsent } from './consent.js';

const STORAGE_KEY = 'baseskill:analytics-consent';

describe('consent', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  describe('getConsent', () => {
    it('returns "unset" when nothing stored', () => {
      expect(getConsent()).toBe('unset');
    });

    it('returns "granted" when "granted" stored', () => {
      globalThis.localStorage.setItem(STORAGE_KEY, 'granted');
      expect(getConsent()).toBe('granted');
    });

    it('returns "denied" when "denied" stored', () => {
      globalThis.localStorage.setItem(STORAGE_KEY, 'denied');
      expect(getConsent()).toBe('denied');
    });

    it('returns "unset" when stored value is garbage', () => {
      globalThis.localStorage.setItem(STORAGE_KEY, 'bogus');
      expect(getConsent()).toBe('unset');
    });
  });

  describe('setConsent', () => {
    it('writes "granted" to localStorage', () => {
      setConsent('granted');
      expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBe(
        'granted',
      );
    });

    it('writes "denied" to localStorage', () => {
      setConsent('denied');
      expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBe(
        'denied',
      );
    });
  });

  describe('subscribeConsent', () => {
    it('fires listener after setConsent', () => {
      const listener = vi.fn();
      const unsub = subscribeConsent(listener);
      setConsent('granted');
      expect(listener).toHaveBeenCalledOnce();
      unsub();
    });

    it('unsubscribe stops listener firing', () => {
      const listener = vi.fn();
      const unsub = subscribeConsent(listener);
      unsub();
      setConsent('granted');
      expect(listener).not.toHaveBeenCalled();
    });

    it('multiple listeners all fire', () => {
      const a = vi.fn();
      const b = vi.fn();
      subscribeConsent(a);
      subscribeConsent(b);
      setConsent('denied');
      expect(a).toHaveBeenCalledOnce();
      expect(b).toHaveBeenCalledOnce();
    });
  });
});
