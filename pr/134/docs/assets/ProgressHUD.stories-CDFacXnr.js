import{j as p}from"./iframe-DYG-fNJf.js";import{P as o}from"./ProgressHUD-CxG9pvid.js";import"./preload-helper-PPVm8Dsz.js";const f={component:o,title:"answer-game/ProgressHUD",tags:["autodocs"],parameters:{layout:"centered",docs:{description:{component:`Classic (round dots + fraction) and level (LEVEL N + cumulative dots) progress HUD. All visible output is driven by the nine controls — use them to reproduce the common presets:

- **Classic last round:** roundIndex 4, totalRounds 5.
- **Dots only:** showFraction off, showLevel off.
- **Fraction only:** showDots off, showLevel off.
- **Level mode (level 3):** isLevelMode on, totalRoundsIsNull on, levelIndex 2, showFraction off, showLevel on.
- **Mixed level + fraction:** isLevelMode on, levelIndex 2, showLevel on (totalRounds stays set).
- **Round-complete pulse:** phase round-complete.
- **All flags off:** renders null.`}}},args:{roundIndex:2,totalRounds:5,totalRoundsIsNull:!1,levelIndex:0,isLevelMode:!1,phase:"playing",showDots:!0,showFraction:!0,showLevel:!1},argTypes:{roundIndex:{control:{type:"range",min:0,max:20,step:1}},totalRounds:{control:{type:"range",min:1,max:20,step:1}},totalRoundsIsNull:{control:"boolean"},levelIndex:{control:{type:"range",min:0,max:20,step:1}},isLevelMode:{control:"boolean"},phase:{control:{type:"select"},options:["playing","round-complete","level-complete","game-over"]},showDots:{control:"boolean"},showFraction:{control:"boolean"},showLevel:{control:"boolean"}},render:({roundIndex:n,totalRounds:s,totalRoundsIsNull:l,levelIndex:t,isLevelMode:r,phase:a,showDots:d,showFraction:u,showLevel:c})=>p.jsx(o,{roundIndex:n,totalRounds:l?null:s,levelIndex:t,isLevelMode:r,phase:a,showDots:d,showFraction:u,showLevel:c})},e={args:{totalRounds:6,levelIndex:6,isLevelMode:!0,phase:"round-complete"}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    totalRounds: 6,
    levelIndex: 6,
    isLevelMode: true,
    phase: 'round-complete'
  }
}`,...e.parameters?.docs?.source}}};const h=["Playground"];export{e as Playground,h as __namedExportsOrder,f as default};
