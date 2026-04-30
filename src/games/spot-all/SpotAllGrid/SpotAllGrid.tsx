import { SpotAllTile } from '../SpotAllTile/SpotAllTile';
import type { SpotAllState } from '../spot-all-reducer';
import type { JSX } from 'react';

export const SpotAllGrid = ({
  state,
  onTap,
}: {
  state: SpotAllState;
  onTap: (tileId: string) => void;
}): JSX.Element => (
  <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
    {state.tiles.map((tile) => (
      <SpotAllTile
        key={tile.id}
        tile={tile}
        isSelected={state.selectedIds.has(tile.id)}
        inCooldown={state.wrongCooldownIds.has(tile.id)}
        onTap={() => onTap(tile.id)}
      />
    ))}
  </div>
);
