import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/game/$gameId')({
  component: GameShell,
})

function GameShell() {
  const { gameId } = Route.useParams()
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Game Shell</h1>
      <p className="mt-2 text-muted-foreground">Loading game: {gameId}</p>
    </main>
  )
}
