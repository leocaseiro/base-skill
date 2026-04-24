// src/components/Footer.test.tsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from './Footer';
import type { ReactNode } from 'react';
import { i18n } from '@/lib/i18n/i18n';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const original =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...original,
    useParams: () => ({ locale: 'en' }),
    useLocation: () => ({ pathname: '/en/', search: {} }),
    useNavigate: () => vi.fn(),
    Link: ({
      children,
      className,
      to: _to,
    }: {
      children?: ReactNode;
      className?: string;
      to: string;
    }): ReactNode => (
      <a className={className} href="http://test/">
        {children}
      </a>
    ),
  };
});

describe('Footer', () => {
  it('renders global footer navigation (only hidden in app layout when not mounted)', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Footer />
      </I18nextProvider>,
    );
    const footer = document.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(
      screen.getByRole('link', { name: 'Settings' }),
    ).toBeInTheDocument();
  });
});
