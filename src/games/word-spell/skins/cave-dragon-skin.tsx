import type { GameSkin } from '@/lib/skin';

const ASSET_BASE = '/skins/word-spell/cave-dragon';

const sceneStyles = `
.skin-cave-dragon {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  max-width: min(2738px, calc(100dvh * 2738 / 1536));
  min-width: 667px;
  margin-inline: auto;
  aspect-ratio: 2738 / 1536;
  container-type: inline-size;
}
.skin-cave-dragon:fullscreen {
  width: min(100vw, calc(100vh * 2738 / 1536));
  max-width: none;
  margin: auto;
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
  transform: scale(calc(100cqi / 962px));
  transform-origin: top center;
}
.cave-dragon-scene__bg-middle {
  position: absolute;
  inset: 0;
  background-image: url('${ASSET_BASE}/bg-middle.png');
  background-repeat: repeat-x;
  background-position: top center;
  background-size: auto 100%;
}
.cave-dragon-scene__bg-left,
.cave-dragon-scene__bg-right,
.cave-dragon-scene__cliff-left,
.cave-dragon-scene__cliff-right {
  position: absolute;
  top: 0;
  bottom: 0;
  height: 100%;
  width: auto;
  display: block;
  user-select: none;
  pointer-events: none;
}
.cave-dragon-scene__bg-left,
.cave-dragon-scene__cliff-left {
  left: 0;
}
.cave-dragon-scene__bg-right {
  right: 0;
}
.cave-dragon-scene__cliff-right {
  right: 0;
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
      <img
        className="cave-dragon-scene__bg-left"
        src={`${ASSET_BASE}/bg-left.png`}
        alt=""
      />
      <img
        className="cave-dragon-scene__bg-right"
        src={`${ASSET_BASE}/bg-right.png`}
        alt=""
      />
      <img
        className="cave-dragon-scene__cliff-left"
        src={`${ASSET_BASE}/cliff-left.png`}
        alt=""
      />
      <img
        className="cave-dragon-scene__cliff-right"
        src={`${ASSET_BASE}/cliff-left.png`}
        alt=""
      />
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
