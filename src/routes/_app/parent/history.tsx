import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/parent/history')({
  component: SessionHistory,
})

function SessionHistory() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Session History</h1>
      <p className="mt-2 text-muted-foreground">Review past learning sessions.</p>
    </main>
  )
}
