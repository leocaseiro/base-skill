import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBankDropTarget } from './useBankDropTarget';

const mockDropTargetForElements = vi.fn().mockReturnValue(() => {});

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  dropTargetForElements: (...args: unknown[]) =>
    mockDropTargetForElements(...args),
}));

const BankHost = () => {
  const { bankRef } = useBankDropTarget();
  return (
    <div ref={bankRef} data-testid="bank-root">
      bank
    </div>
  );
};

describe('useBankDropTarget', () => {
  it('registers a drop target on the bank container when mounted', () => {
    mockDropTargetForElements.mockClear();
    render(<BankHost />);
    expect(screen.getByTestId('bank-root')).toBeInTheDocument();
    expect(mockDropTargetForElements).toHaveBeenCalledTimes(1);
    const args = mockDropTargetForElements.mock.calls[0]?.[0] as {
      element: HTMLElement;
    };
    expect(args.element).toBeInstanceOf(HTMLElement);
  });
});
