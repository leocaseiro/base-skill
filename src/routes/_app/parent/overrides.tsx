import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/parent/overrides')({
  component: GameOverrides,
})

function GameOverrides() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Game Overrides</h1>
      <p className="mt-2 text-muted-foreground">
        Customize game difficulty and content per learner.
      </p>
    </main>
  )
}
