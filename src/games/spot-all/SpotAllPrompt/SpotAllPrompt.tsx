import type { JSX } from 'react';

export const SpotAllPrompt = ({
  target,
}: {
  target: string;
}): JSX.Element => (
  <p className="text-center text-2xl font-semibold text-foreground">
    Select all the{' '}
    <span className="rounded bg-primary/10 px-2 py-1 font-bold text-primary">
      {target}
    </span>{' '}
    tiles
  </p>
);
