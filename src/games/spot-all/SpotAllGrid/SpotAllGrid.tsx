import { SpotAllTile } from '../SpotAllTile/SpotAllTile';
import type { SpotAllState } from '../spot-all-reducer';
import type { JSX } from 'react';

export const SpotAllGrid = ({
  state,
  onToggleTile,
}: {
  state: SpotAllState;
  onToggleTile: (tileId: string) => void;
}): JSX.Element => (
  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
    {state.tiles.map((tile) => (
      <SpotAllTile
        key={tile.id}
        tile={tile}
        isSelected={state.selectedIds.has(tile.id)}
        feedback={state.feedback}
        onToggle={() => onToggleTile(tile.id)}
      />
    ))}
  </div>
);
