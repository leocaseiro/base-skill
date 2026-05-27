import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsentBanner } from './ConsentBanner';
import * as ga4 from '@/lib/analytics/ga4';

vi.mock('@/lib/analytics/ga4', async (importOriginal) => {
  const original =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory
    await importOriginal<typeof import('@/lib/analytics/ga4')>();
  return {
    ...original,
    isAnalyticsEnabled: vi.fn(),
  };
});

const enabledMock = vi.mocked(ga4.isAnalyticsEnabled);
const STORAGE_KEY = 'baseskill:analytics-consent';

describe('ConsentBanner', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    enabledMock.mockReset();
  });

  it('renders nothing when analytics is disabled', () => {
    enabledMock.mockReturnValue(false);
    render(<ConsentBanner />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders nothing when consent is already granted', () => {
    enabledMock.mockReturnValue(true);
    globalThis.localStorage.setItem(STORAGE_KEY, 'granted');
    render(<ConsentBanner />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders nothing when consent is denied', () => {
    enabledMock.mockReturnValue(true);
    globalThis.localStorage.setItem(STORAGE_KEY, 'denied');
    render(<ConsentBanner />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders banner when analytics enabled and consent unset', () => {
    enabledMock.mockReturnValue(true);
    render(<ConsentBanner />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Accept' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reject' }),
    ).toBeInTheDocument();
  });

  it('clicking Accept stores "granted" and hides the banner', async () => {
    const user = userEvent.setup();
    enabledMock.mockReturnValue(true);
    render(<ConsentBanner />);
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBe(
      'granted',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking Reject stores "denied" and hides the banner', async () => {
    const user = userEvent.setup();
    enabledMock.mockReturnValue(true);
    render(<ConsentBanner />);
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBe('denied');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
