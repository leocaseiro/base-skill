import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/parent/sync')({
  component: CloudSync,
})

function CloudSync() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Cloud Sync</h1>
      <p className="mt-2 text-muted-foreground">
        Sync learner data across devices.
      </p>
    </main>
  )
}
