import type {
  GameSkin,
  GameSkinTileSnapshot,
  GameSkinZoneSnapshot,
} from '@/lib/skin';

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
  left: 10%;
  top: 4%;
  width: 14%;
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

/* ── Stone tile override ──────────────────────────────────────── */
/* Paint reset for every stone-styled button (bank tile + slot's placed tile). */
.skin-cave-dragon [aria-label^="Letter "],
.skin-cave-dragon [aria-label^="Number "],
.skin-cave-dragon [data-zone-index] button {
  background: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  text-shadow:
    0 1px 0 rgba(255, 240, 200, 0.4),
    0 -1px 0 rgba(0, 0, 0, 0.3) !important;
  color: #3a200c !important;
  isolation: isolate;
}
/* Bank-tile buttons are statically positioned by default — mark them relative
   so the absolute stone child sizes against the tile, not the bank container.
   Slot buttons keep their existing absolute inset-0 position. */
.skin-cave-dragon [aria-label^="Letter "],
.skin-cave-dragon [aria-label^="Number "] {
  position: relative;
}
/* .cave-dragon-stone is intentionally unscoped — the eject-ghost is appended to
   document.body via slot-animations.ts, outside .skin-cave-dragon. The class
   name is unique enough not to clash. */
.cave-dragon-stone {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  display: block;
}

/* ── Slot/bank-hole stone outline ─────────────────────────────── */
.skin-cave-dragon .cave-dragon-stone-outline {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: block;
  z-index: 2;
  overflow: visible;
}
.skin-cave-dragon .cave-dragon-stone-outline--empty {
  color: rgba(58, 32, 12, 0.55);
}
.skin-cave-dragon .cave-dragon-stone-outline--correct {
  color: var(--bs-primary);
}
.skin-cave-dragon .cave-dragon-stone-outline--wrong {
  color: var(--destructive);
}
.skin-cave-dragon [data-tile-bank-hole] {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M 100,14 C 126,14 158,30 174,58 C 182,86 182,114 178,142 C 162,170 124,184 98,188 C 72,184 38,168 24,144 C 18,116 18,86 26,54 C 40,30 74,14 100,14 Z' fill='none' stroke='%233a200c' stroke-width='12' stroke-dasharray='12 6' stroke-linejoin='round' opacity='0.55'/%3E%3C/svg%3E") !important;
  background-size: 100% 100% !important;
  background-repeat: no-repeat !important;
  background-color: transparent !important;
}

/* ── Audio button — sandstone with carved drop shadow ─────────── */
.skin-cave-dragon button[aria-label="Hear the question"] {
  filter: drop-shadow(0 -4px 12px rgba(0, 0, 0, 0.4));
}
`;

const SceneBackground = () => (
  <>
    <style>{sceneStyles}</style>

    {/* Hidden symbol library — referenced via <use href="#cd-stoneTile"/> */}
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="cd-stRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8e2c0" />
          <stop offset="50%" stopColor="#d4ab82" />
          <stop offset="100%" stopColor="#9e7050" />
        </linearGradient>
        <linearGradient id="cd-stFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eed3aa" />
          <stop offset="100%" stopColor="#a87a52" />
        </linearGradient>
        <radialGradient id="cd-stGlow" cx="50%" cy="15%" r="55%">
          <stop offset="0%" stopColor="#fff5d8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff5d8" stopOpacity="0" />
        </radialGradient>
        <symbol id="cd-stoneTile" viewBox="0 0 200 200">
          <path
            d="M 100,14 C 126,14 158,30 174,58 C 182,86 182,114 178,142 C 162,170 124,184 98,188 C 72,184 38,168 24,144 C 18,116 18,86 26,54 C 40,30 74,14 100,14 Z"
            fill="url(#cd-stRim)"
            stroke="#1a0e08"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M 100,30 C 122,30 148,42 160,66 C 166,90 166,114 162,140 C 148,162 122,174 98,176 C 74,174 52,162 40,140 C 36,114 36,90 40,66 C 52,42 78,30 100,30 Z"
            fill="url(#cd-stFace)"
          />
          <path
            d="M 100,30 C 122,30 148,42 160,66 C 166,90 166,114 162,140 C 148,162 122,174 98,176 C 74,174 52,162 40,140 C 36,114 36,90 40,66 C 52,42 78,30 100,30 Z"
            fill="url(#cd-stGlow)"
          />
          {/* Speckles — paired dark + light flecks */}
          <ellipse
            cx="62"
            cy="60"
            rx="6"
            ry="1.8"
            transform="rotate(-35 62 60)"
            fill="#5a3820"
            opacity="0.5"
          />
          <ellipse
            cx="66"
            cy="64"
            rx="5"
            ry="0.8"
            transform="rotate(-35 66 64)"
            fill="#fff0d0"
            opacity="0.55"
          />
          <ellipse
            cx="120"
            cy="52"
            rx="7"
            ry="2"
            transform="rotate(35 120 52)"
            fill="#5a3820"
            opacity="0.5"
          />
          <ellipse
            cx="124"
            cy="56"
            rx="6"
            ry="1"
            transform="rotate(35 124 56)"
            fill="#fff0d0"
            opacity="0.55"
          />
          <ellipse
            cx="150"
            cy="85"
            rx="6"
            ry="1.8"
            transform="rotate(75 150 85)"
            fill="#5a3820"
            opacity="0.5"
          />
          <ellipse
            cx="153"
            cy="88"
            rx="5"
            ry="0.8"
            transform="rotate(75 153 88)"
            fill="#fff0d0"
            opacity="0.55"
          />
          <ellipse
            cx="156"
            cy="138"
            rx="7"
            ry="2"
            transform="rotate(-55 156 138)"
            fill="#5a3820"
            opacity="0.5"
          />
          <ellipse
            cx="153"
            cy="141"
            rx="6"
            ry="1"
            transform="rotate(-55 153 141)"
            fill="#fff0d0"
            opacity="0.55"
          />
          <ellipse
            cx="105"
            cy="164"
            rx="7"
            ry="2"
            transform="rotate(15 105 164)"
            fill="#5a3820"
            opacity="0.5"
          />
          <ellipse
            cx="109"
            cy="168"
            rx="6"
            ry="1"
            transform="rotate(15 109 168)"
            fill="#fff0d0"
            opacity="0.55"
          />
          <ellipse
            cx="55"
            cy="138"
            rx="5"
            ry="1.5"
            transform="rotate(40 55 138)"
            fill="#5a3820"
            opacity="0.5"
          />
          <ellipse
            cx="58"
            cy="141"
            rx="4"
            ry="0.7"
            transform="rotate(40 58 141)"
            fill="#fff0d0"
            opacity="0.55"
          />
        </symbol>
      </defs>
    </svg>

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

const tileDecoration = (_tile: GameSkinTileSnapshot) => (
  <svg
    className="cave-dragon-stone"
    viewBox="0 0 200 200"
    aria-hidden="true"
    focusable="false"
  >
    <use href="#cd-stoneTile" />
  </svg>
);

const STONE_OUTLINE_PATH =
  'M 100,14 C 126,14 158,30 174,58 C 182,86 182,114 178,142 C 162,170 124,184 98,188 C 72,184 38,168 24,144 C 18,116 18,86 26,54 C 40,30 74,14 100,14 Z';

const slotDecoration = (zone: GameSkinZoneSnapshot) => {
  const empty = zone.placedTileId === null;
  const stateClass = empty
    ? 'cave-dragon-stone-outline--empty'
    : zone.isWrong
      ? 'cave-dragon-stone-outline--wrong'
      : 'cave-dragon-stone-outline--correct';
  return (
    <svg
      className={`cave-dragon-stone-outline ${stateClass}`}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={STONE_OUTLINE_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={empty ? 12 : 20}
        strokeLinejoin="round"
        strokeDasharray={empty ? '12 6' : undefined}
      />
    </svg>
  );
};

export const caveDragonSkin: GameSkin = {
  id: 'cave-dragon',
  name: 'Cave & Dragon',
  tokens: {
    '--skin-bank-hole-bg': 'transparent',
    '--skin-bank-hole-shadow': 'none',
    '--skin-slot-bg': 'transparent',
    '--skin-slot-border': 'transparent',
    '--skin-correct-bg': 'transparent',
    '--skin-correct-border': 'transparent',
    '--skin-wrong-bg': 'transparent',
    '--skin-wrong-border': 'transparent',
    // Drag-over preview indicator: drop the rectangular pulse-ring; the
    // empty-state stone outline already provides the hover affordance.
    '--skin-hover-border-color': 'transparent',
    '--skin-hover-border-style': 'none',
    '--skin-question-audio-bg': '#f7d168',
    '--skin-question-audio-fg': '#000000',
    // HUD tokens — cave palette: dark amethyst dots with a gold "current"
    // ring, white fraction label/separator/level text against the cave bg.
    '--skin-hud-dot-fill': '#2E1954',
    '--skin-hud-dot-current-border': '#F6C562',
    '--skin-hud-fraction-color': '#ffffff',
    '--skin-hud-fraction-sep-color': '#ffffff',
    '--skin-hud-level-color': '#ffffff',
  },
  SceneBackground,
  tileDecoration,
  slotDecoration,
};
