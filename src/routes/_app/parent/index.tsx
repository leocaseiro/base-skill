import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/parent/')({
  component: ParentHome,
})

function ParentHome() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Parent Settings</h1>
      <p className="mt-2 text-muted-foreground">Manage learner profiles and app configuration.</p>
    </main>
  )
}
