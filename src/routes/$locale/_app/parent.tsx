import { Outlet, createFileRoute } from '@tanstack/react-router';

const ParentLayout = () => (
  <div>
    {/* Parent settings layout */}
    <Outlet />
  </div>
);

export const Route = createFileRoute('/$locale/_app/parent')({
  component: ParentLayout,
});
