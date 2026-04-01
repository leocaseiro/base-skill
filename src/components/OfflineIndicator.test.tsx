import { act, render, screen } from '@testing-library/react';
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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.spyOn(globalThis.navigator, 'onLine', 'get').mockReturnValue(
      true,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when online', () => {
    const { container } = render(<OfflineIndicator />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('shows offline banner when navigator.onLine is false', () => {
    vi.spyOn(globalThis.navigator, 'onLine', 'get').mockReturnValue(
      false,
    );
    render(<OfflineIndicator />, { wrapper });
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it('shows banner after offline event fires', () => {
    render(<OfflineIndicator />, { wrapper });
    act(() => {
      vi.spyOn(globalThis.navigator, 'onLine', 'get').mockReturnValue(
        false,
      );
      globalThis.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it('hides banner after online event fires', () => {
    vi.spyOn(globalThis.navigator, 'onLine', 'get').mockReturnValue(
      false,
    );
    render(<OfflineIndicator />, { wrapper });
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();

    act(() => {
      vi.spyOn(globalThis.navigator, 'onLine', 'get').mockReturnValue(
        true,
      );
      globalThis.dispatchEvent(new Event('online'));
    });
    expect(
      screen.queryByText(/you're offline/i),
    ).not.toBeInTheDocument();
  });
});
