import { describe, expect, it } from 'vitest';
import { detectPrPreviewRedirect } from './spa-redirect';

describe('detectPrPreviewRedirect', () => {
  it('returns redirect target for a PR preview deep link', () => {
    expect(
      detectPrPreviewRedirect(
        '/base-skill/pr/317/app/en/game/spot-all',
        '/base-skill',
      ),
    ).toBe('/base-skill/pr/317/app/');
  });

  it('returns redirect target with different PR numbers', () => {
    expect(
      detectPrPreviewRedirect(
        '/base-skill/pr/42/app/en/',
        '/base-skill',
      ),
    ).toBe('/base-skill/pr/42/app/');
  });

  it('returns null for production deep links', () => {
    expect(
      detectPrPreviewRedirect(
        '/base-skill/en/game/spot-all',
        '/base-skill',
      ),
    ).toBeNull();
  });

  it('returns null for production root', () => {
    expect(
      detectPrPreviewRedirect('/base-skill/', '/base-skill'),
    ).toBeNull();
  });

  it('returns null when the app is already a PR preview build', () => {
    expect(
      detectPrPreviewRedirect(
        '/base-skill/pr/317/app/en/game/spot-all',
        '/base-skill/pr/317/app',
      ),
    ).toBeNull();
  });

  it('returns null for PR path without /app/ segment', () => {
    expect(
      detectPrPreviewRedirect(
        '/base-skill/pr/317/docs/',
        '/base-skill',
      ),
    ).toBeNull();
  });

  it('returns null for non-numeric PR identifier', () => {
    expect(
      detectPrPreviewRedirect(
        '/base-skill/pr/abc/app/en/',
        '/base-skill',
      ),
    ).toBeNull();
  });

  it('returns null when pathname does not start with base', () => {
    expect(
      detectPrPreviewRedirect(
        '/other-repo/pr/317/app/en/',
        '/base-skill',
      ),
    ).toBeNull();
  });

  it('works with root base path', () => {
    expect(detectPrPreviewRedirect('/pr/5/app/en/', '')).toBe(
      '/pr/5/app/',
    );
  });
});
