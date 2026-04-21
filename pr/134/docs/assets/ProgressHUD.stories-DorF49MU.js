import{j as f}from"./iframe-DEygXkeu.js";import{P as u}from"./ProgressHUD-BpqJ_93I.js";import"./preload-helper-PPVm8Dsz.js";const I={component:u,title:"answer-game/ProgressHUD",parameters:{layout:"centered"},args:{roundIndex:2,totalRounds:5,totalRoundsIsNull:!1,levelIndex:0,isLevelMode:!1,phase:"playing",showDots:!0,showFraction:!0,showLevel:!1},argTypes:{roundIndex:{control:{type:"range",min:0,max:20,step:1}},totalRounds:{control:{type:"range",min:1,max:20,step:1}},totalRoundsIsNull:{control:"boolean"},levelIndex:{control:{type:"range",min:0,max:20,step:1}},isLevelMode:{control:"boolean"},phase:{control:{type:"select"},options:["playing","round-complete","level-complete","game-over"]},showDots:{control:"boolean"},showFraction:{control:"boolean"},showLevel:{control:"boolean"}},render:({roundIndex:d,totalRounds:p,totalRoundsIsNull:m,levelIndex:i,isLevelMode:v,phase:g,showDots:h,showFraction:L,showLevel:w})=>f.jsx(u,{roundIndex:d,totalRounds:m?null:p,levelIndex:i,isLevelMode:v,phase:g,showDots:h,showFraction:L,showLevel:w})},e={},s={args:{roundIndex:4,totalRounds:5}},o={args:{showFraction:!1,showLevel:!1}},r={args:{showDots:!1,showLevel:!1}},a={args:{isLevelMode:!0,totalRoundsIsNull:!0,levelIndex:2,showFraction:!1,showLevel:!0}},n={args:{isLevelMode:!0,totalRoundsIsNull:!0,levelIndex:9,showFraction:!1,showLevel:!0}},t={args:{isLevelMode:!0,totalRounds:5,levelIndex:2,showFraction:!0,showLevel:!0}},l={args:{phase:"round-complete"}},c={args:{showDots:!1,showFraction:!1,showLevel:!1}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    roundIndex: 4,
    totalRounds: 5
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    showFraction: false,
    showLevel: false
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    showDots: false,
    showLevel: false
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    isLevelMode: true,
    totalRoundsIsNull: true,
    levelIndex: 2,
    showFraction: false,
    showLevel: true
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    isLevelMode: true,
    totalRoundsIsNull: true,
    levelIndex: 9,
    showFraction: false,
    showLevel: true
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    isLevelMode: true,
    totalRounds: 5,
    levelIndex: 2,
    showFraction: true,
    showLevel: true
  }
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    phase: 'round-complete'
  }
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    showDots: false,
    showFraction: false,
    showLevel: false
  }
}`,...c.parameters?.docs?.source}}};const M=["Classic_Round3Of5","Classic_LastRound","DotsOnly","FractionOnly","LevelMode_Level3","LevelMode_Level10","Mixed_LevelPlusFraction","RoundCompletePhase","AllFlagsOff"];export{c as AllFlagsOff,s as Classic_LastRound,e as Classic_Round3Of5,o as DotsOnly,r as FractionOnly,n as LevelMode_Level10,a as LevelMode_Level3,t as Mixed_LevelPlusFraction,l as RoundCompletePhase,M as __namedExportsOrder,I as default};
