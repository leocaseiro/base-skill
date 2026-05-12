import{j as e,S as p,a as l}from"./iframe-4XKdcNQE.js";import{w as g}from"./withDb-Blqotizc.js";import{w as f}from"./withRouter-C-azqMs-.js";import{W as m}from"./WordSpell-C77az7P9.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-MfIOpZf8.js";import"./import-wrapper-prod-Bw53qYwY.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-BcobVt71.js";import"./index-DY-1ctsH.js";import"./index-CgD5U346.js";import"./index-D12hh4mk.js";import"./LetterTileBank-D5Df-kh8.js";import"./styles-Cu2jWhUp.js";import"./AnswerGameProvider-C422Rac0.js";import"./AudioFeedback--m-fHcTR.js";import"./useDraggableTile-BbZbLuXg.js";import"./useGameTTS-D8zHCJ-N.js";import"./useSettings-DXYsyZls.js";import"./useRxQuery-DXg_yqCH.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-6iUiI-hS.js";import"./index-CvE2ipYh.js";import"./filter-COPBV8aV.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./useGameSounds-BmnYwgt4.js";import"./AnswerGame-DJRhOpth.js";import"./ProgressHUD-B8H1La6O.js";import"./GameOverOverlay-C-pjbjyI.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-DuQV6wC3.js";import"./SentenceWithGaps-DgwdUEHc.js";import"./SlotRow-DvC3S9Tn.js";import"./useRoundTTS-CR5v8TRa.js";import"./AudioButton-9KvOQlcH.js";import"./volume-2-DnB2TUDB.js";import"./createLucideIcon-BalBWFu9.js";import"./ImageQuestion-LmoJsbjC.js";import"./build-round-order-G70tL7jo.js";const a="./skins/word-spell/cave-dragon",u=[{cx:60,r:6,delay:0,duration:2.4},{cx:140,r:4,delay:1.4,duration:2.8},{cx:230,r:8,delay:2.6,duration:3.2},{cx:320,r:5,delay:.8,duration:2.6},{cx:410,r:7,delay:1.9,duration:3},{cx:500,r:6,delay:3.1,duration:2.4},{cx:590,r:9,delay:.4,duration:3.4},{cx:680,r:5,delay:2.1,duration:2.6},{cx:770,r:7,delay:1,duration:2.8},{cx:860,r:4,delay:3.6,duration:2.4},{cx:950,r:8,delay:.9,duration:3},{cx:1040,r:6,delay:2.3,duration:2.8},{cx:1130,r:5,delay:1.5,duration:2.6}],x=`
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
  background-image: url('${a}/bg-middle.png');
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
  background-image: url('${a}/dragon.png');
  background-repeat: no-repeat;
  background-position: bottom center;
  background-size: contain;
}
.cave-dragon-scene__lava-svg {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 32%;
  display: block;
  pointer-events: none;
  overflow: visible;
}
.cd-lava-wave {
  animation: cd-lava-wave-bob 2.6s ease-in-out infinite alternate;
}
@keyframes cd-lava-wave-bob {
  from {
    transform: translateY(-6px);
  }
  to {
    transform: translateY(6px);
  }
}
.cd-lava-bubble {
  animation-name: cd-lava-bubble-rise;
  animation-iteration-count: infinite;
  animation-timing-function: ease-out;
}
@keyframes cd-lava-bubble-rise {
  0% {
    transform: translateY(0);
    opacity: 0.75;
  }
  85% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-180px);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cd-lava-wave,
  .cd-lava-bubble {
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
`,v=()=>e.jsxs(e.Fragment,{children:[e.jsx("style",{children:x}),e.jsx("svg",{width:"0",height:"0",style:{position:"absolute"},"aria-hidden":"true",focusable:"false",children:e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:"cd-stRim",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#f8e2c0"}),e.jsx("stop",{offset:"50%",stopColor:"#d4ab82"}),e.jsx("stop",{offset:"100%",stopColor:"#9e7050"})]}),e.jsxs("linearGradient",{id:"cd-stFace",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#eed3aa"}),e.jsx("stop",{offset:"100%",stopColor:"#a87a52"})]}),e.jsxs("radialGradient",{id:"cd-stGlow",cx:"50%",cy:"15%",r:"55%",children:[e.jsx("stop",{offset:"0%",stopColor:"#fff5d8",stopOpacity:"0.45"}),e.jsx("stop",{offset:"100%",stopColor:"#fff5d8",stopOpacity:"0"})]}),e.jsxs("symbol",{id:"cd-stoneTile",viewBox:"0 0 200 200",children:[e.jsx("path",{d:"M 100,14 C 126,14 158,30 174,58 C 182,86 182,114 178,142 C 162,170 124,184 98,188 C 72,184 38,168 24,144 C 18,116 18,86 26,54 C 40,30 74,14 100,14 Z",fill:"url(#cd-stRim)",stroke:"#1a0e08",strokeWidth:"6",strokeLinejoin:"round"}),e.jsx("path",{d:"M 100,30 C 122,30 148,42 160,66 C 166,90 166,114 162,140 C 148,162 122,174 98,176 C 74,174 52,162 40,140 C 36,114 36,90 40,66 C 52,42 78,30 100,30 Z",fill:"url(#cd-stFace)"}),e.jsx("path",{d:"M 100,30 C 122,30 148,42 160,66 C 166,90 166,114 162,140 C 148,162 122,174 98,176 C 74,174 52,162 40,140 C 36,114 36,90 40,66 C 52,42 78,30 100,30 Z",fill:"url(#cd-stGlow)"}),e.jsx("ellipse",{cx:"62",cy:"60",rx:"6",ry:"1.8",transform:"rotate(-35 62 60)",fill:"#5a3820",opacity:"0.5"}),e.jsx("ellipse",{cx:"66",cy:"64",rx:"5",ry:"0.8",transform:"rotate(-35 66 64)",fill:"#fff0d0",opacity:"0.55"}),e.jsx("ellipse",{cx:"120",cy:"52",rx:"7",ry:"2",transform:"rotate(35 120 52)",fill:"#5a3820",opacity:"0.5"}),e.jsx("ellipse",{cx:"124",cy:"56",rx:"6",ry:"1",transform:"rotate(35 124 56)",fill:"#fff0d0",opacity:"0.55"}),e.jsx("ellipse",{cx:"150",cy:"85",rx:"6",ry:"1.8",transform:"rotate(75 150 85)",fill:"#5a3820",opacity:"0.5"}),e.jsx("ellipse",{cx:"153",cy:"88",rx:"5",ry:"0.8",transform:"rotate(75 153 88)",fill:"#fff0d0",opacity:"0.55"}),e.jsx("ellipse",{cx:"156",cy:"138",rx:"7",ry:"2",transform:"rotate(-55 156 138)",fill:"#5a3820",opacity:"0.5"}),e.jsx("ellipse",{cx:"153",cy:"141",rx:"6",ry:"1",transform:"rotate(-55 153 141)",fill:"#fff0d0",opacity:"0.55"}),e.jsx("ellipse",{cx:"105",cy:"164",rx:"7",ry:"2",transform:"rotate(15 105 164)",fill:"#5a3820",opacity:"0.5"}),e.jsx("ellipse",{cx:"109",cy:"168",rx:"6",ry:"1",transform:"rotate(15 109 168)",fill:"#fff0d0",opacity:"0.55"}),e.jsx("ellipse",{cx:"55",cy:"138",rx:"5",ry:"1.5",transform:"rotate(40 55 138)",fill:"#5a3820",opacity:"0.5"}),e.jsx("ellipse",{cx:"58",cy:"141",rx:"4",ry:"0.7",transform:"rotate(40 58 141)",fill:"#fff0d0",opacity:"0.55"})]})]})}),e.jsxs("div",{className:"cave-dragon-scene","aria-hidden":"true",children:[e.jsx("div",{className:"cave-dragon-scene__bg-middle"}),e.jsx("img",{className:"cave-dragon-scene__bg-left",src:`${a}/bg-left.png`,alt:""}),e.jsx("img",{className:"cave-dragon-scene__bg-right",src:`${a}/bg-right.png`,alt:""}),e.jsx("img",{className:"cave-dragon-scene__cliff-left",src:`${a}/cliff-left.png`,alt:""}),e.jsx("img",{className:"cave-dragon-scene__cliff-right",src:`${a}/cliff-left.png`,alt:""}),e.jsx("div",{className:"cave-dragon-scene__dragon"}),e.jsxs("svg",{className:"cave-dragon-scene__lava-svg",viewBox:"0 0 1200 300",preserveAspectRatio:"none","aria-hidden":"true",focusable:"false",children:[e.jsx("defs",{children:e.jsxs("linearGradient",{id:"cd-lava-grad",x1:"0",x2:"0",y1:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#FF4500"}),e.jsx("stop",{offset:"40%",stopColor:"#FF8C00"}),e.jsx("stop",{offset:"100%",stopColor:"#8B0000"})]})}),e.jsx("rect",{x:"0",y:"20",width:"1200",height:"280",fill:"url(#cd-lava-grad)"}),e.jsx("path",{className:"cd-lava-wave",d:"M0,40 Q150,20 300,40 T600,40 T900,40 T1200,40 V90 H0 Z",fill:"url(#cd-lava-grad)"}),u.map(o=>e.jsx("circle",{className:"cd-lava-bubble",cx:o.cx,cy:250,r:o.r,fill:"#FFD700",opacity:"0.75",style:{animationDelay:`${o.delay}s`,animationDuration:`${o.duration}s`}},o.cx))]})]})]}),h=o=>e.jsx("svg",{className:"cave-dragon-stone",viewBox:"0 0 200 200","aria-hidden":"true",focusable:"false",children:e.jsx("use",{href:"#cd-stoneTile"})}),b="M 100,14 C 126,14 158,30 174,58 C 182,86 182,114 178,142 C 162,170 124,184 98,188 C 72,184 38,168 24,144 C 18,116 18,86 26,54 C 40,30 74,14 100,14 Z",k=o=>{const t=o.placedTileId===null,s=t?"cave-dragon-stone-outline--empty":o.isWrong?"cave-dragon-stone-outline--wrong":"cave-dragon-stone-outline--correct";return e.jsx("svg",{className:`cave-dragon-stone-outline ${s}`,viewBox:"0 0 200 200","aria-hidden":"true",focusable:"false",children:e.jsx("path",{d:b,fill:"none",stroke:"currentColor",strokeWidth:t?12:20,strokeLinejoin:"round",strokeDasharray:t?"12 6":void 0})})},y={id:"cave-dragon",name:"Cave & Dragon",tokens:{"--skin-bank-hole-bg":"transparent","--skin-bank-hole-shadow":"none","--skin-slot-bg":"transparent","--skin-slot-border":"transparent","--skin-correct-bg":"transparent","--skin-correct-border":"transparent","--skin-wrong-bg":"transparent","--skin-wrong-border":"transparent","--skin-hover-border-color":"transparent","--skin-hover-border-style":"none","--skin-question-audio-bg":"#f7d168","--skin-question-audio-fg":"#000000","--skin-hud-dot-fill":"#2E1954","--skin-hud-dot-current-border":"#F6C562","--skin-hud-fraction-color":"#ffffff","--skin-hud-fraction-sep-color":"#ffffff","--skin-hud-level-color":"#ffffff"},SceneBackground:v,tileDecoration:h,slotDecoration:k},w={id:"demo",name:"Demo Pink",tokens:{"--skin-tile-bg":"#ec4899","--skin-tile-text":"#fff","--skin-tile-radius":"50%","--skin-slot-bg":"#fdf2f8","--skin-slot-border":"#f472b6","--skin-slot-radius":"50%","--skin-sentence-gap-border":"#ec4899","--skin-question-audio-bg":"#ec4899"},onCorrectPlace:(o,t)=>{console.log(`[word-spell demo] correct @ ${o}: ${t}`)},onWrongPlace:(o,t)=>{console.log(`[word-spell demo] wrong @ ${o}: ${t}`)}};l("word-spell",w);l("word-spell",y);const d={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!1,tileUnit:"letter",mode:"picture",rounds:[{word:"cat",image:"https://placehold.co/160?text=cat"},{word:"dog",image:"https://placehold.co/160?text=dog"},{word:"hen",image:"https://placehold.co/160?text=hen"},{word:"pig",image:"https://placehold.co/160?text=pig"},{word:"fox",image:"https://placehold.co/160?text=fox"}]},c=o=>({allTiles:[{id:"tile-d",label:"d",value:"d"},{id:"tile-g",label:"g",value:"g"},{id:"tile-o",label:"o",value:"o"}],bankTileIds:["tile-d","tile-g","tile-o"],zones:[{id:"z0",index:0,expectedValue:"d",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"o",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"g",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:"playing",roundIndex:o,retryCount:0,levelIndex:0}),j={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"cat"},{word:"dog"}]},C=({config:o,initialState:t})=>e.jsx(p,{gameId:"word-spell",children:({skin:s})=>e.jsx(m,{config:{...o,skin:s.id},initialState:t,seed:"storybook"})}),me={title:"Games/WordSpell/Skin Harness",component:C,tags:["autodocs"],decorators:[g,f],args:{config:j}},r={},n={args:{config:d,initialState:c(1)}},i={args:{config:d,initialState:c(4)}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    config: fiveRoundConfig,
    initialState: dogDraftState(1)
  }
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    config: fiveRoundConfig,
    initialState: dogDraftState(4)
  }
}`,...i.parameters?.docs?.source}}};const ue=["Default","HUD_Round2Of5","HUD_Round5Of5"];export{r as Default,n as HUD_Round2Of5,i as HUD_Round5Of5,ue as __namedExportsOrder,me as default};
