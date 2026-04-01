import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/$locale/_app/game/$gameId')({
  component: GameShell,
});

const GameShell = () => {
  const { gameId } = Route.useParams();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Game Shell</h1>
      <p className="mt-2 text-muted-foreground">
        Loading game: {gameId}
      </p>
    </div>
  );
};
