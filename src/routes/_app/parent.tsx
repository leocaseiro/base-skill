import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/parent')({
  component: ParentLayout,
})

function ParentLayout() {
  return (
    <div>
      {/* Parent settings layout */}
      <Outlet />
    </div>
  )
}
