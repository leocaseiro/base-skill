// src/components/FullscreenToggle.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { FullscreenToggle } from './FullscreenToggle';
import { i18n } from '@/lib/i18n/i18n';

const setFullscreenEnabled = (value: boolean) => {
  Object.defineProperty(document, 'fullscreenEnabled', {
    configurable: true,
    value,
  });
};

const setRequestFullscreen = (fn: () => Promise<void>) => {
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    configurable: true,
    value: fn,
  });
};

const setExitFullscreen = (fn: () => Promise<void>) => {
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: fn,
  });
};

const setUserAgent = (ua: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value: ua,
  });
};

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

beforeEach(() => {
  setUserAgent(DESKTOP_UA);
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    value: 0,
  });
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  });
});

afterEach(() => {
  delete document.documentElement.dataset['pseudoFullscreen'];
});

const renderToggle = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <FullscreenToggle />
    </I18nextProvider>,
  );

describe('FullscreenToggle', () => {
  it('renders nothing when fullscreen is unsupported (non-iOS desktop without API)', () => {
    setFullscreenEnabled(false);
    const { container } = renderToggle();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the button when the native fullscreen API is available', () => {
    setFullscreenEnabled(true);
    setRequestFullscreen(() => Promise.resolve());
    setExitFullscreen(() => Promise.resolve());
    renderToggle();
    expect(
      screen.getByRole('button', { name: /enter fullscreen/i }),
    ).toBeInTheDocument();
  });

  it('renders the button on iPhone Safari (pseudo-fullscreen fallback)', () => {
    setFullscreenEnabled(false);
    setUserAgent(IPHONE_UA);
    renderToggle();
    expect(
      screen.getByRole('button', { name: /enter fullscreen/i }),
    ).toBeInTheDocument();
  });

  it('calls the native requestFullscreen when clicked on a supported browser', async () => {
    const request = vi.fn<() => Promise<void>>().mockResolvedValue();
    setFullscreenEnabled(true);
    setRequestFullscreen(request);
    setExitFullscreen(() => Promise.resolve());
    renderToggle();
    await userEvent.click(
      screen.getByRole('button', { name: /enter fullscreen/i }),
    );
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('applies the pseudo-fullscreen attribute when clicked on iPhone', async () => {
    setFullscreenEnabled(false);
    setUserAgent(IPHONE_UA);
    renderToggle();
    await userEvent.click(
      screen.getByRole('button', { name: /enter fullscreen/i }),
    );
    expect(document.documentElement.dataset['pseudoFullscreen']).toBe(
      'true',
    );
  });
});
