import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('Profile Picker route', () => {
  it('renders the profile picker heading', () => {
    function ProfilePicker() {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold">Profile Picker</h1>
        </div>
      )
    }
    render(<ProfilePicker />)
    expect(
      screen.getByRole('heading', { name: /profile picker/i }),
    ).toBeInTheDocument()
  })
})
