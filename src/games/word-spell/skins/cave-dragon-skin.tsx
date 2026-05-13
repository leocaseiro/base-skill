import type {
  GameSkin,
  GameSkinTileSnapshot,
  GameSkinZoneSnapshot,
} from '@/lib/skin';
import type { CSSProperties } from 'react';

// Resolve against Vite's BASE_URL so the same paths work in dev (`/`),
// the main app build (`/base-skill/`), and the Storybook build deployed
// under `/base-skill/pr/<n>/docs/`. Hardcoding an absolute path broke the
// PR-preview deploy where the iframe lives below the domain root.
const ASSET_BASE = `${import.meta.env.BASE_URL}skins/word-spell/cave-dragon`;

// Hand-distributed bubble positions across the stage width (in cqw units, so
// each bubble's horizontal slot and pixel-size both scale with the cave
// container). Stable seed — no SSR/random mismatch. Each bubble carries its
// own rise height (cqw) so the rises stagger vertically as well as in time.
const LAVA_BUBBLES = [
  {
    left: 5,
    startBottom: 55,
    size: 1.1,
    delay: 0,
    duration: 3.2,
    rise: 14,
  },
  {
    left: 11.5,
    startBottom: 42,
    size: 0.8,
    delay: 1.4,
    duration: 3.6,
    rise: 16,
  },
  {
    left: 19,
    startBottom: 60,
    size: 1.5,
    delay: 2.6,
    duration: 4,
    rise: 18,
  },
  {
    left: 27,
    startBottom: 38,
    size: 1,
    delay: 0.8,
    duration: 3.4,
    rise: 15,
  },
  {
    left: 34,
    startBottom: 65,
    size: 1.3,
    delay: 1.9,
    duration: 3.6,
    rise: 17,
  },
  {
    left: 42,
    startBottom: 48,
    size: 1.1,
    delay: 3.1,
    duration: 3.2,
    rise: 15,
  },
  {
    left: 49,
    startBottom: 70,
    size: 1.7,
    delay: 0.4,
    duration: 4.2,
    rise: 20,
  },
  {
    left: 57,
    startBottom: 35,
    size: 1,
    delay: 2.1,
    duration: 3.4,
    rise: 14,
  },
  {
    left: 65,
    startBottom: 58,
    size: 1.3,
    delay: 1,
    duration: 3.8,
    rise: 18,
  },
  {
    left: 73,
    startBottom: 45,
    size: 0.8,
    delay: 3.6,
    duration: 3,
    rise: 13,
  },
  {
    left: 80,
    startBottom: 62,
    size: 1.5,
    delay: 0.9,
    duration: 4,
    rise: 19,
  },
  {
    left: 87,
    startBottom: 50,
    size: 1.1,
    delay: 2.3,
    duration: 3.4,
    rise: 16,
  },
  {
    left: 94,
    startBottom: 40,
    size: 1,
    delay: 1.5,
    duration: 3.2,
    rise: 14,
  },
];

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
/* ── Lava floor ───────────────────────────────────────────────── */
/* The 5 inline SVG wave layers paint the entire lava — no base
   gradient on the div (which previously left a flat strip above the
   topmost wave). overflow: visible so bubbles can rise past the
   lava band into the cave above. */
.cave-dragon-scene__lava {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 32%;
  overflow: visible;
  pointer-events: none;
}
.cave-dragon-scene__lava-waves {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.cd-wave {
  will-change: d;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in-out;
}
/* Five waves stacked top → bottom. Waves 2–5 use the exact path-d
   shapes from base-skill-resources/waves.html (frames 0% and 50%,
   which are the most contrasting in that animation). Wave 1 is a
   new top layer with a custom bezier in matching style. Each layer
   has its own per-wave gradient (cd-wave-grad-N) with stops mapped
   in userSpaceOnUse to the wave's visible band, so the gradient is
   actually graduated within the visible strip — fixing the
   previous "narrow slice of a tall gradient" flatness. */
.cd-wave-1 {
  animation-name: cd-wave-morph-1;
  animation-duration: 2.4s;
}
.cd-wave-2 {
  animation-name: cd-wave-morph-2;
  animation-duration: 3.0s;
  animation-delay: -0.8s;
}
.cd-wave-3 {
  animation-name: cd-wave-morph-3;
  animation-duration: 2.6s;
  animation-delay: -1.3s;
}
.cd-wave-4 {
  animation-name: cd-wave-morph-4;
  animation-duration: 3.2s;
  animation-delay: -0.6s;
}
.cd-wave-5 {
  animation-name: cd-wave-morph-5;
  animation-duration: 2.8s;
  animation-delay: -1.5s;
}
@keyframes cd-wave-morph-1 {
  from {
    d: path('M 0,600 L 0,30 C 75,8 155,55 215,28 C 285,5 365,52 450,32 C 530,8 615,50 695,26 C 775,6 855,52 935,30 C 1010,10 1095,48 1175,28 C 1255,8 1335,42 1440,30 L 1440,600 L 0,600 Z');
  }
  to {
    d: path('M 0,600 L 0,30 C 75,52 155,5 215,32 C 285,55 365,8 450,28 C 530,52 615,10 695,34 C 775,54 855,8 935,30 C 1010,50 1095,12 1175,32 C 1255,52 1335,18 1440,30 L 1440,600 L 0,600 Z');
  }
}
@keyframes cd-wave-morph-2 {
  from {
    d: path('M 0,600 L 0,90 C 71.59,78.63 143.17,67.26 203,71 C 262.83,74.74 310.89,93.59 383,86 C 455.11,78.41 551.26,44.38 626,47 C 700.74,49.62 754.05,88.89 826,106 C 897.95,123.11 988.52,118.07 1054,121 C 1119.48,123.93 1159.85,134.84 1220,131 C 1280.15,127.16 1360.07,108.58 1440,90 L 1440,600 L 0,600 Z');
  }
  to {
    d: path('M 0,600 L 0,90 C 62.48,105.47 124.95,120.94 186,106 C 247.05,91.06 306.67,45.72 373,54 C 439.33,62.28 512.38,124.17 589,122 C 665.62,119.83 745.82,53.58 814,51 C 882.18,48.42 938.36,109.50 1010,123 C 1081.64,136.50 1168.76,102.43 1243,89 C 1317.24,75.57 1378.62,82.79 1440,90 L 1440,600 L 0,600 Z');
  }
}
@keyframes cd-wave-morph-3 {
  from {
    d: path('M 0,600 L 0,210 C 74.04,180.80 148.07,151.59 206,166 C 263.93,180.41 305.75,238.43 382,243 C 458.25,247.57 568.95,198.70 635,195 C 701.05,191.30 722.47,232.76 785,243 C 847.53,253.24 951.18,232.26 1032,213 C 1112.82,193.74 1170.81,176.21 1235,176 C 1299.19,175.79 1369.60,192.89 1440,210 L 1440,600 L 0,600 Z');
  }
  to {
    d: path('M 0,600 L 0,210 C 64.73,201.55 129.46,193.11 195,201 C 260.54,208.89 326.88,233.13 390,239 C 453.12,244.87 513.02,232.37 593,231 C 672.98,229.63 773.02,239.39 844,237 C 914.98,234.61 956.88,220.09 1017,203 C 1077.12,185.91 1155.46,166.26 1229,167 C 1302.54,167.74 1371.27,188.87 1440,210 L 1440,600 L 0,600 Z');
  }
}
@keyframes cd-wave-morph-4 {
  from {
    d: path('M 0,600 L 0,330 C 76.28,310.58 152.56,291.16 213,295 C 273.44,298.84 318.03,325.95 386,328 C 453.97,330.05 545.32,307.06 618,305 C 690.68,302.94 744.68,321.82 808,341 C 871.32,360.18 943.97,379.66 1013,371 C 1082.03,362.34 1147.44,325.52 1218,314 C 1288.56,302.48 1364.28,316.24 1440,330 L 1440,600 L 0,600 Z');
  }
  to {
    d: path('M 0,600 L 0,330 C 72.72,336.26 145.44,342.52 208,340 C 270.56,337.48 322.96,326.18 387,314 C 451.04,301.82 526.70,288.75 608,287 C 689.30,285.25 776.22,294.81 851,300 C 925.78,305.19 988.40,306.01 1058,307 C 1127.60,307.99 1204.17,309.14 1269,313 C 1333.83,316.86 1386.91,323.43 1440,330 L 1440,600 L 0,600 Z');
  }
}
@keyframes cd-wave-morph-5 {
  from {
    d: path('M 0,600 L 0,450 C 68.59,433.08 137.18,416.16 206,423 C 274.82,429.84 343.88,460.43 411,461 C 478.12,461.57 543.29,432.12 605,438 C 666.71,443.88 724.95,485.10 791,487 C 857.05,488.90 930.90,451.47 1004,441 C 1077.10,430.53 1149.46,447.01 1222,453 C 1294.54,458.99 1367.27,454.50 1440,450 L 1440,600 L 0,600 Z');
  }
  to {
    d: path('M 0,600 L 0,450 C 88.97,457.72 177.93,465.44 239,461 C 300.07,456.56 333.23,439.97 401,449 C 468.77,458.03 571.13,492.69 645,491 C 718.87,489.31 764.23,451.26 827,440 C 889.77,428.74 969.94,444.28 1034,449 C 1098.06,453.72 1146.02,447.64 1211,446 C 1275.98,444.36 1357.99,447.18 1440,450 L 1440,600 L 0,600 Z');
  }
}
.cave-dragon-scene__lava-bubble {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    #ffe072 0%,
    #ff9a3c 55%,
    #c84410 100%
  );
  pointer-events: none;
  animation-name: cd-lava-bubble-rise;
  animation-iteration-count: infinite;
  animation-timing-function: ease-out;
  will-change: transform, opacity;
}
@keyframes cd-lava-bubble-rise {
  0% {
    transform: translateY(0);
    opacity: 0.85;
  }
  85% {
    transform: translateY(calc(var(--cd-bubble-rise, 22cqw) * -0.88));
    opacity: 0.78;
  }
  100% {
    transform: translateY(calc(var(--cd-bubble-rise, 22cqw) * -1));
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cd-wave,
  .cave-dragon-scene__lava-bubble {
    animation: none;
  }
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
   name is unique enough not to clash. drop-shadow filter follows the stone
   outline (not a rectangle), so dragged ghosts get a clean "picked up" lift
   without leaking a phantom rounded-rect shadow. */
.cave-dragon-stone {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  display: block;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
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
      <div className="cave-dragon-scene__lava" aria-hidden="true">
        {/* Five inline SVG wave layers stacked top → bottom. Waves 2-5
            copy the path-d shapes verbatim from
            base-skill-resources/waves.html. Wave 1 is a new top layer
            so the lava has no flat strip at the surface. Each wave
            has its own per-wave gradient with stops mapped (via
            userSpaceOnUse) to the wave's visible band only — so the
            gradient is fully graduated across the visible strip
            instead of showing a narrow slice of a tall gradient. */}
        <svg
          className="cave-dragon-scene__lava-waves"
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient
              id="cd-wave-grad-1"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="30"
              x2="0"
              y2="90"
            >
              <stop offset="0%" stopColor="#FAB21F" />
              <stop offset="100%" stopColor="#E69810" />
            </linearGradient>
            <linearGradient
              id="cd-wave-grad-2"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="90"
              x2="0"
              y2="210"
            >
              <stop offset="0%" stopColor="#ffa844" />
              <stop offset="100%" stopColor="#ff7800" />
            </linearGradient>
            <linearGradient
              id="cd-wave-grad-3"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="210"
              x2="0"
              y2="330"
            >
              <stop offset="0%" stopColor="#ff6700" />
              <stop offset="100%" stopColor="#ff3300" />
            </linearGradient>
            <linearGradient
              id="cd-wave-grad-4"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="330"
              x2="0"
              y2="450"
            >
              <stop offset="0%" stopColor="#c12810" />
              <stop offset="100%" stopColor="#7a1a0a" />
            </linearGradient>
            <linearGradient
              id="cd-wave-grad-5"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="450"
              x2="0"
              y2="600"
            >
              <stop offset="0%" stopColor="#5e1208" />
              <stop offset="100%" stopColor="#2a0a04" />
            </linearGradient>
          </defs>
          <path
            className="cd-wave cd-wave-1"
            d="M 0,600 L 0,30 C 75,8 155,55 215,28 C 285,5 365,52 450,32 C 530,8 615,50 695,26 C 775,6 855,52 935,30 C 1010,10 1095,48 1175,28 C 1255,8 1335,42 1440,30 L 1440,600 L 0,600 Z"
            fill="url(#cd-wave-grad-1)"
          />
          <path
            className="cd-wave cd-wave-2"
            d="M 0,600 L 0,90 C 71.59,78.63 143.17,67.26 203,71 C 262.83,74.74 310.89,93.59 383,86 C 455.11,78.41 551.26,44.38 626,47 C 700.74,49.62 754.05,88.89 826,106 C 897.95,123.11 988.52,118.07 1054,121 C 1119.48,123.93 1159.85,134.84 1220,131 C 1280.15,127.16 1360.07,108.58 1440,90 L 1440,600 L 0,600 Z"
            fill="url(#cd-wave-grad-2)"
          />
          <path
            className="cd-wave cd-wave-3"
            d="M 0,600 L 0,210 C 74.04,180.80 148.07,151.59 206,166 C 263.93,180.41 305.75,238.43 382,243 C 458.25,247.57 568.95,198.70 635,195 C 701.05,191.30 722.47,232.76 785,243 C 847.53,253.24 951.18,232.26 1032,213 C 1112.82,193.74 1170.81,176.21 1235,176 C 1299.19,175.79 1369.60,192.89 1440,210 L 1440,600 L 0,600 Z"
            fill="url(#cd-wave-grad-3)"
          />
          <path
            className="cd-wave cd-wave-4"
            d="M 0,600 L 0,330 C 76.28,310.58 152.56,291.16 213,295 C 273.44,298.84 318.03,325.95 386,328 C 453.97,330.05 545.32,307.06 618,305 C 690.68,302.94 744.68,321.82 808,341 C 871.32,360.18 943.97,379.66 1013,371 C 1082.03,362.34 1147.44,325.52 1218,314 C 1288.56,302.48 1364.28,316.24 1440,330 L 1440,600 L 0,600 Z"
            fill="url(#cd-wave-grad-4)"
          />
          <path
            className="cd-wave cd-wave-5"
            d="M 0,600 L 0,450 C 68.59,433.08 137.18,416.16 206,423 C 274.82,429.84 343.88,460.43 411,461 C 478.12,461.57 543.29,432.12 605,438 C 666.71,443.88 724.95,485.10 791,487 C 857.05,488.90 930.90,451.47 1004,441 C 1077.10,430.53 1149.46,447.01 1222,453 C 1294.54,458.99 1367.27,454.50 1440,450 L 1440,600 L 0,600 Z"
            fill="url(#cd-wave-grad-5)"
          />
        </svg>
        {/* Rising bubbles. Plain HTML divs so they stay perfectly round
            at every viewport (no SVG aspect-ratio math) and can rise
            past the lava band into the cave above via overflow: visible
            on the parent. left/size/rise all use cqw so the layout
            scales with the stage container. */}
        {LAVA_BUBBLES.map((b, i) => (
          <div
            key={i}
            className="cave-dragon-scene__lava-bubble"
            style={
              {
                left: `${b.left}cqw`,
                bottom: `${b.startBottom}%`,
                width: `${b.size}cqw`,
                height: `${b.size}cqw`,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.duration}s`,
                '--cd-bubble-rise': `${b.rise}cqw`,
              } as CSSProperties
            }
          />
        ))}
      </div>
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
