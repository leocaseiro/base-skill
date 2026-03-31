import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="min-h-screen">
      {/* Placeholder: offline indicator, theme provider, i18n provider */}
      <Outlet />
    </div>
  )
}
