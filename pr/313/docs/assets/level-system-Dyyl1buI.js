import{j as e}from"./iframe-D0kUxzr7.js";import{u as t,M as r}from"./blocks-DKLxLhE0.js";import"./preload-helper-PPVm8Dsz.js";import"./index-2Ks4cHAa.js";import"./index-BCuR6QdB.js";import"./index-DSDXp6V0.js";import"./index-CZh48vsP.js";import"./index-DrFu-skq.js";function l(s){const n={code:"code",h1:"h1",h2:"h2",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...t(),...s.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(r,{title:"Games/Level System"}),`
`,e.jsx(n.h1,{id:"level-system",children:"Level System"}),`
`,e.jsxs(n.p,{children:[`
  `,`The level system adds progressive gameplay to any AnswerGame-based game. Instead
  of a fixed set of rounds, players advance through levels that are generated
  on-the-fly. Each game defines its own level generation logic.
`]}),`
`,e.jsx(n.h2,{id:"how-it-works",children:"How It Works"}),`
`,e.jsxs(n.ol,{children:[`
  `,e.jsx(n.li,{children:"Player completes all answer zones in a level"}),`
  `,e.jsxs(n.li,{children:["A ",e.jsx(n.strong,{children:"Level Complete"}),` screen appears (confetti + "Next Level" / "I'm Done")`]}),`
  `,e.jsxs(n.li,{children:['Tapping "Next Level" generates the next level via ',e.jsx(n.code,{children:"generateNextLevel"})]}),`
  `,e.jsx(n.li,{children:`Tapping "I'm Done" ends the session and shows the Game Over screen`}),`
  `,e.jsxs(n.li,{children:["If ",e.jsx(n.code,{children:"maxLevels"})," is set and reached, the game ends automatically"]}),`
`]}),`
`,e.jsx(n.h2,{id:"opting-in",children:"Opting In"}),`
`,e.jsxs(n.p,{children:["Add ",e.jsx(n.code,{children:"levelMode"})," to your ",e.jsx(n.code,{children:"AnswerGameConfig"}),":"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`levelMode: {
  // Optional: cap the number of levels. Omit for unlimited.
  maxLevels: 5,
  // Required: generates the next level's tiles and zones.
  // Receives the 0-based index of the just-completed level.
  generateNextLevel: (completedLevel: number) => {
    // Return { tiles, zones } or null to end early
    return buildYourRound(completedLevel);
  },
}
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"When ",e.jsx(n.code,{children:"levelMode"})," is present, set ",e.jsx(n.code,{children:"totalRounds: 1"}),` (each level is one round).
  Provide the first level via `,e.jsx(n.code,{children:"initialTiles"})," / ",e.jsx(n.code,{children:"initialZones"}),` as usual.
`]}),`
`,e.jsx(n.h2,{id:"sortnumbers-example",children:"SortNumbers Example"}),`
`,e.jsxs(n.p,{children:[`
  `,`SortNumbers uses level mode with unlimited levels. Each level continues the
  number sequence:
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`// Config: start=2, step=2, quantity=5
// Level 0: 2, 4, 6, 8, 10
// Level 1: 12, 14, 16, 18, 20
// Level 2: 22, 24, 26, 28, 30

import { createSortNumbersLevelGenerator } from './sort-numbers/sort-numbers-level-generator';

const generator = createSortNumbersLevelGenerator({
  start: 2,
  step: 2,
  quantity: 5,
  direction: 'ascending',
});

const config = {
  // ...other config
  totalRounds: 1,
  levelMode: {
    generateNextLevel: generator,
  },
};
`})}),`
`,e.jsx(n.h2,{id:"unlimited-vs-capped",children:"Unlimited vs Capped"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Config"}),`
      `,e.jsx(n.th,{children:"Behavior"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"levelMode: { generateNextLevel }"})}),`
      `,e.jsx(n.td,{children:"Unlimited — player decides when done"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"levelMode: { maxLevels: 5, ... }"})}),`
      `,e.jsx(n.td,{children:"Caps at 5 levels then game over"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsxs(n.td,{children:["No ",e.jsx(n.code,{children:"levelMode"})]}),`
      `,e.jsx(n.td,{children:"Classic rounds mode (no change)"}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.h2,{id:"sounds",children:"Sounds"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Phase"}),`
      `,e.jsx(n.th,{children:"Sound"}),`
      `,e.jsx(n.th,{children:"Visual"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Level complete"}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"level-complete"})}),`
      `,e.jsx(n.td,{children:"Confetti burst"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Game over"}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"game-complete"})}),`
      `,e.jsx(n.td,{children:"Fireworks confetti"}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.h2,{id:"games-using-level-mode",children:"Games Using Level Mode"}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"SortNumbers"})," — unlimited levels, continues the sequence pattern"]}),`
`]}),`
`,e.jsxs(n.p,{children:[`
  `,"Other games (NumberMatch, WordSpell) can adopt level mode by adding ",e.jsx(n.code,{children:"levelMode"}),`
  to their configs.
`]})]})}function m(s={}){const{wrapper:n}={...t(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(l,{...s})}):l(s)}export{m as default};
