// src/components/OfflineIndicator.test.tsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { OfflineIndicator } from './OfflineIndicator';
import { i18n } from '@/lib/i18n/i18n';

const renderO = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <OfflineIndicator />
    </I18nextProvider>,
  );

describe('OfflineIndicator', () => {
  const origOnLine = navigator.onLine;

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      ...navigator,
      onLine: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => origOnLine,
    });
  });

  it('renders nothing when online', () => {
    const { container } = renderO();
    expect(container.firstChild).toBeNull();
  });

  it('shows a status banner when offline (stays in layout during fullscreen in-game)', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      onLine: false,
    });
    renderO();
    expect(
      screen.getByText("You're offline. Playing from saved data."),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
