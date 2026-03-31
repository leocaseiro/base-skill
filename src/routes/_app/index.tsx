import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
  component: ProfilePicker,
})

function ProfilePicker() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Profile Picker</h1>
      <p className="mt-2 text-muted-foreground">Select or create a learner profile.</p>
    </main>
  )
}
