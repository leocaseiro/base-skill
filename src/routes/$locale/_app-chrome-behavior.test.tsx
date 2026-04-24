// src/routes/$locale/_app-chrome-behavior.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { JSX } from 'react';
import { shouldRenderAppHeaderFooter } from '@/lib/app-paths';

/**
 * Mirrors the chrome split in `/_app` layout: only header/footer use
 * `showAppChrome`; offline + service-worker update strip stay mounted.
 */
const AppLayoutChromeProbe = ({
  pathname,
}: {
  pathname: string;
}): JSX.Element => {
  const show = shouldRenderAppHeaderFooter(pathname);
  return (
    <div className="flex min-h-screen flex-col">
      {show ? <div data-testid="mock-header" /> : null}
      <div data-testid="mock-offline-indicator" />
      <div data-testid="mock-update-banner" />
      <main className="flex-1" data-testid="main-outlet" />
      {show ? <div data-testid="mock-footer" /> : null}
    </div>
  );
};

describe('_app layout chrome contract (fullscreen in-game)', () => {
  it('omits global header and footer for game session paths', () => {
    render(<AppLayoutChromeProbe pathname="/en/game/word-spell" />);
    expect(screen.queryByTestId('mock-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-footer')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('mock-offline-indicator'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('mock-update-banner'),
    ).toBeInTheDocument();
  });

  it('shows global header and footer for non-game paths', () => {
    render(<AppLayoutChromeProbe pathname="/en/settings" />);
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    expect(
      screen.getByTestId('mock-offline-indicator'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('mock-update-banner'),
    ).toBeInTheDocument();
  });
});
