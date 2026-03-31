import { describe, expect, it } from 'vitest'
import { applyThemeCssVars } from './css-vars'
import { defaultThemeCssVars } from './default-tokens'

describe('applyThemeCssVars', () => {
  it('sets --bs-background on an element', () => {
    const el = document.createElement('div')
    applyThemeCssVars(el, defaultThemeCssVars)
    expect(el.style.getPropertyValue('--bs-background').trim()).toBe(
      defaultThemeCssVars['--bs-background'],
    )
  })
})
