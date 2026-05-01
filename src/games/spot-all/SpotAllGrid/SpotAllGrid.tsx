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
  <div className="flex w-full max-w-full flex-wrap justify-center gap-3">
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
