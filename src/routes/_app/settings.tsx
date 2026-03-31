import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings')({
  component: Settings,
})

function Settings() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">App settings.</p>
    </main>
  )
}
