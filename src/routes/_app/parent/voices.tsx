import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/parent/voices')({
  component: VoiceSelector,
})

function VoiceSelector() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">TTS Voice Selector</h1>
      <p className="mt-2 text-muted-foreground">
        Choose text-to-speech voices for each learner.
      </p>
    </main>
  )
}
