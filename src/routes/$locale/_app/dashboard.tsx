import { createFileRoute } from '@tanstack/react-router';

const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <p className="mt-2 text-muted-foreground">
      Learner progress overview.
    </p>
  </div>
);

export const Route = createFileRoute('/$locale/_app/dashboard')({
  component: Dashboard,
});
