import { act, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { VoiceUnavailableWarning } from './VoiceUnavailableWarning';
import type { ReactNode } from 'react';

const settingsMock = {
  preferredVoiceURI: undefined as string | undefined,
};

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: settingsMock,
    update: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'voice' in opts ? `${key}:${opts.voice as string}` : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ locale: 'en' }),
  Link: ({
    children,
    to: _to,
    params: _params,
    target: _target,
    rel: _rel,
    className,
  }: {
    children?: ReactNode;
    to: string;
    params?: Record<string, string>;
    target?: string;
    rel?: string;
    className?: string;
  }): ReactNode => (
    <a className={className} href="http://test/">
      {children}
    </a>
  ),
}));

type VoicesChangedHandler = () => void;

const setupSpeechSynthesis = (
  voices: Array<Partial<SpeechSynthesisVoice>>,
): {
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  fireVoicesChanged: () => void;
} => {
  const handlers: VoicesChangedHandler[] = [];
  const addEventListener = vi.fn(
    (event: string, handler: VoicesChangedHandler) => {
      if (event === 'voiceschanged') handlers.push(handler);
    },
  );
  const removeEventListener = vi.fn(
    (event: string, handler: VoicesChangedHandler) => {
      if (event === 'voiceschanged') {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
      }
    },
  );
  vi.stubGlobal('speechSynthesis', {
    getVoices: vi.fn(() => voices),
    addEventListener,
    removeEventListener,
  });
  return {
    addEventListener,
    removeEventListener,
    fireVoicesChanged: () => {
      for (const h of handlers) h();
    },
  };
};

describe('VoiceUnavailableWarning', () => {
  beforeEach(() => {
    settingsMock.preferredVoiceURI = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders null when preferredVoice is undefined', () => {
    setupSpeechSynthesis([{ name: 'Samantha' }]);
    const { container } = render(<VoiceUnavailableWarning />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders null when preferredVoice is in the loaded voice list', () => {
    settingsMock.preferredVoiceURI = 'Samantha';
    setupSpeechSynthesis([{ name: 'Samantha' }]);
    const { container } = render(<VoiceUnavailableWarning />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the banner with role="alert" and the missing voice name when preferred voice is missing on initial check', () => {
    settingsMock.preferredVoiceURI = 'Karen';
    setupSpeechSynthesis([{ name: 'Samantha' }]);
    render(<VoiceUnavailableWarning />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toContain('Karen');
  });

  it('renders the banner after voiceschanged fires with a voice list missing the preferred voice', () => {
    settingsMock.preferredVoiceURI = 'Karen';
    const voiceList: Array<{ name: string }> = [];
    const handlers: Array<() => void> = [];
    vi.stubGlobal('speechSynthesis', {
      getVoices: vi.fn(() => voiceList),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === 'voiceschanged') handlers.push(handler);
      }),
      removeEventListener: vi.fn(),
    });
    render(<VoiceUnavailableWarning />);
    // No alert yet — voices not loaded
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // Now voices load but don't include Karen
    voiceList.push({ name: 'Samantha' });
    act(() => {
      for (const h of handlers) h();
    });
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toContain('Karen');
  });

  it('cleanup removes the voiceschanged listener on unmount', () => {
    settingsMock.preferredVoiceURI = 'Karen';
    const { addEventListener, removeEventListener } =
      setupSpeechSynthesis([{ name: 'Samantha' }]);
    const { unmount } = render(<VoiceUnavailableWarning />);
    expect(addEventListener).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function),
    );
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function),
    );
  });

  it('renders null when offline even if preferred voice is missing (OfflineIndicator already covers the user)', () => {
    settingsMock.preferredVoiceURI = 'Karen';
    setupSpeechSynthesis([{ name: 'Samantha' }]);
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis.navigator,
      'onLine',
    );
    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    try {
      const { container } = render(<VoiceUnavailableWarning />);
      expect(container).toBeEmptyDOMElement();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(
          globalThis.navigator,
          'onLine',
          originalDescriptor,
        );
      }
    }
  });

  it('re-renders the banner when transitioning offline -> online with preferred voice still missing', () => {
    settingsMock.preferredVoiceURI = 'Karen';
    setupSpeechSynthesis([{ name: 'Samantha' }]);
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis.navigator,
      'onLine',
    );
    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    try {
      render(<VoiceUnavailableWarning />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      Object.defineProperty(globalThis.navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });
      act(() => {
        globalThis.dispatchEvent(new Event('online'));
      });
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toContain('Karen');
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(
          globalThis.navigator,
          'onLine',
          originalDescriptor,
        );
      }
    }
  });
});
