import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Root document', () => {
  it('renders without crashing', () => {
    const RootShell = ({ children }: { children: React.ReactNode }) => (
      <div data-testid="root-shell">{children}</div>
    );
    render(<RootShell>hello</RootShell>);
    expect(screen.getByTestId('root-shell')).toBeInTheDocument();
  });
});
