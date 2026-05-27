import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  VoiceUnavailableDialogProvider,
  useVoiceUnavailableDialog,
} from './VoiceUnavailableDialogProvider';
import type { JSX, ReactNode } from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'voice' in opts ? `${key}:${opts.voice as string}` : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to: _to,
    params,
    target,
    rel,
  }: {
    children?: ReactNode;
    to: string;
    params?: Record<string, string>;
    target?: string;
    rel?: string;
  }): ReactNode => (
    <a
      href={`/${params?.locale ?? ''}/settings`}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  ),
}));

type TriggerHandle = {
  show: (voiceName: string, locale: string) => void;
};

const Trigger = ({
  handleRef,
}: {
  handleRef: { current: TriggerHandle | null };
}): JSX.Element => {
  const ctx = useVoiceUnavailableDialog();
  useEffect(() => {
    handleRef.current = ctx;
  }, [ctx, handleRef]);
  return <span>trigger</span>;
};

const renderProvider = () => {
  const handleRef: { current: TriggerHandle | null } = {
    current: null,
  };
  const utils = render(
    <VoiceUnavailableDialogProvider>
      <Trigger handleRef={handleRef} />
    </VoiceUnavailableDialogProvider>,
  );
  return { ...utils, handleRef };
};

describe('VoiceUnavailableDialogProvider', () => {
  it('show(voiceName, locale) opens the dialog and shows the voice name in the description', async () => {
    const { handleRef } = renderProvider();
    await Promise.resolve();
    handleRef.current!.show('Karen', 'en');
    expect(
      await screen.findByText(
        /voiceUnavailable\.dialogDescription:Karen/i,
      ),
    ).toBeInTheDocument();
  });

  it('Dismiss button closes the dialog', async () => {
    const user = userEvent.setup();
    const { handleRef } = renderProvider();
    handleRef.current!.show('Karen', 'en');
    const dismiss = await screen.findByRole('button', {
      name: /voiceUnavailable\.dialogCancel/i,
    });
    await user.click(dismiss);
    expect(
      screen.queryByText(/voiceUnavailable\.dialogDescription:Karen/i),
    ).not.toBeInTheDocument();
  });

  it('settings link href contains /en/settings when locale is en', async () => {
    const { handleRef } = renderProvider();
    handleRef.current!.show('Karen', 'en');
    const link = await screen.findByText(
      /voiceUnavailable\.dialogAction/i,
    );
    expect(link.getAttribute('href')).toContain('/en/settings');
  });

  it('settings link href contains /pt-BR/settings when locale is pt-BR', async () => {
    const { handleRef } = renderProvider();
    handleRef.current!.show('SomeVoice', 'pt-BR');
    const link = await screen.findByText(
      /voiceUnavailable\.dialogAction/i,
    );
    expect(link.getAttribute('href')).toContain('/pt-BR/settings');
  });

  it('useVoiceUnavailableDialog throws when used outside the provider', () => {
    const ErrorTrigger = (): JSX.Element => {
      useVoiceUnavailableDialog();
      return <span>nope</span>;
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ErrorTrigger />)).toThrow(
      /must be used inside VoiceUnavailableDialogProvider/,
    );
    spy.mockRestore();
  });
});
