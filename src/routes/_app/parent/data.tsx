import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/parent/data')({
  component: DataManagement,
})

function DataManagement() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Data Management</h1>
      <p className="mt-2 text-muted-foreground">
        Export, import, or delete learner data.
      </p>
    </main>
  )
}
