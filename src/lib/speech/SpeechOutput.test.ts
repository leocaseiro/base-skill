import { afterEach, describe, expect, it, vi } from 'vitest'
import { cancelSpeech, speak } from './SpeechOutput'

describe('SpeechOutput', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('speak does not throw when speechSynthesis is undefined', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    expect(() => speak('hello')).not.toThrow()
  })

  it('cancelSpeech does not throw when speechSynthesis is undefined', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    expect(() => cancelSpeech()).not.toThrow()
  })
})
