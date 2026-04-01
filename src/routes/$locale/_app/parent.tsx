import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/$locale/_app/parent')({
  component: ParentLayout,
});

const ParentLayout = () => (
  <div>
    {/* Parent settings layout */}
    <Outlet />
  </div>
);
