import { createFileRoute } from '@tanstack/react-router';

const Settings = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Settings</h1>
    <p className="mt-2 text-muted-foreground">App settings.</p>
  </div>
);

export const Route = createFileRoute('/$locale/_app/settings')({
  component: Settings,
});
