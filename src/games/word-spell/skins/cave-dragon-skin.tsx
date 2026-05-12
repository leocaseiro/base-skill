import type { GameSkin } from '@/lib/skin';

const ASSET_BASE = '/skins/word-spell/cave-dragon';

const sceneStyles = `
.skin-cave-dragon {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}
.skin-cave-dragon > .cave-dragon-scene {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.skin-cave-dragon > *:not(.cave-dragon-scene) {
  position: relative;
  z-index: 1;
}
.cave-dragon-scene__bg-middle {
  position: absolute;
  inset: 0;
  background-image: url('${ASSET_BASE}/bg-middle.png');
  background-repeat: repeat-x;
  background-position: top center;
  background-size: auto 100%;
}
.cave-dragon-scene__bg-left {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 32%;
  background-image: url('${ASSET_BASE}/bg-left.png');
  background-repeat: no-repeat;
  background-position: top left;
  background-size: cover;
}
.cave-dragon-scene__bg-right {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 32%;
  background-image: url('${ASSET_BASE}/bg-right.png');
  background-repeat: no-repeat;
  background-position: top right;
  background-size: cover;
}
.cave-dragon-scene__cliff-left {
  position: absolute;
  left: 0;
  top: 38%;
  width: 28%;
  height: 32%;
  background-image: url('${ASSET_BASE}/cliff-left.png');
  background-repeat: no-repeat;
  background-position: bottom left;
  background-size: contain;
}
.cave-dragon-scene__cliff-right {
  position: absolute;
  right: 0;
  top: 38%;
  width: 28%;
  height: 32%;
  background-image: url('${ASSET_BASE}/cliff-left.png');
  background-repeat: no-repeat;
  background-position: bottom right;
  background-size: contain;
  transform: scaleX(-1);
}
.cave-dragon-scene__dragon {
  position: absolute;
  left: 4%;
  top: 22%;
  width: 22%;
  height: 38%;
  background-image: url('${ASSET_BASE}/dragon.png');
  background-repeat: no-repeat;
  background-position: bottom center;
  background-size: contain;
}
.cave-dragon-scene__lava {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 32%;
  background-image: url('${ASSET_BASE}/lava-floor-tile.svg');
  background-repeat: repeat-x;
  background-position: bottom left;
  background-size: auto 100%;
}
`;

const SceneBackground = () => (
  <>
    <style>{sceneStyles}</style>
    <div className="cave-dragon-scene" aria-hidden="true">
      <div className="cave-dragon-scene__bg-middle" />
      <div className="cave-dragon-scene__bg-left" />
      <div className="cave-dragon-scene__bg-right" />
      <div className="cave-dragon-scene__cliff-left" />
      <div className="cave-dragon-scene__cliff-right" />
      <div className="cave-dragon-scene__dragon" />
      <div className="cave-dragon-scene__lava" />
    </div>
  </>
);

export const caveDragonSkin: GameSkin = {
  id: 'cave-dragon',
  name: 'Cave & Dragon',
  tokens: {},
  SceneBackground,
};
