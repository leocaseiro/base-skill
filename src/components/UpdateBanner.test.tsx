// src/components/UpdateBanner.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UpdateBanner } from './UpdateBanner';
import { ServiceWorkerContext } from '@/lib/service-worker/ServiceWorkerContext';

const { mockPathname, applyUpdate } = vi.hoisted(() => ({
  mockPathname: vi.fn(() => '/en/'),
  applyUpdate: vi.fn(),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const original =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...original,
    useLocation: () => ({ pathname: mockPathname() }),
  };
});

const renderWithSw = (updateAvailable: boolean) =>
  render(
    <ServiceWorkerContext.Provider
      value={{ updateAvailable, applyUpdate }}
    >
      <UpdateBanner />
    </ServiceWorkerContext.Provider>,
  );

describe('UpdateBanner', () => {
  it('hides the strip on in-app game paths even when an update is available', () => {
    mockPathname.mockReturnValue('/en/game/word-spell');
    const { container } = renderWithSw(true);
    expect(container.firstChild).toBeNull();
  });

  it('shows the strip when an update is available and not in-game', () => {
    mockPathname.mockReturnValue('/en/');
    renderWithSw(true);
    expect(
      screen.getByText(/new version available — tap to update/i),
    ).toBeInTheDocument();
  });

  it('calls applyUpdate from the provider when Update is pressed', async () => {
    mockPathname.mockReturnValue('/en/');
    const user = userEvent.setup();
    renderWithSw(true);
    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => {
      expect(applyUpdate).toHaveBeenCalled();
    });
  });
});
