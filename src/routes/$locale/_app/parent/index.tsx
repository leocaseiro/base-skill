import { createFileRoute } from '@tanstack/react-router';

const ParentHome = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Parent Settings</h1>
    <p className="mt-2 text-muted-foreground">
      Manage learner profiles and app configuration.
    </p>
  </div>
);

export const Route = createFileRoute('/$locale/_app/parent/')({
  component: ParentHome,
});
