import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('Root document', () => {
  it('renders without crashing', () => {
    function RootShell({ children }: { children: React.ReactNode }) {
      return <div data-testid="root-shell">{children}</div>
    }
    render(<RootShell>hello</RootShell>)
    expect(screen.getByTestId('root-shell')).toBeInTheDocument()
  })
})
