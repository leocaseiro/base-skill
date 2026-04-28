import{j as e}from"./iframe-CysCsZeq.js";import{w as i}from"./withDb-3nt2ffiC.js";import{w as p}from"./withRouter-Bi61_0z-.js";import{C as l}from"./ConfigFormFields-lttVRYeW.js";import{G as c}from"./GameShell-D0JLhnFv.js";import{G as a}from"./GameNameChip-COv4I_k-.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BfXJ66bT.js";import"./import-wrapper-prod-DTHZdadV.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DfJooSNM.js";import"./index-BrlUyA4v.js";import"./index-DuYNeE3_.js";import"./alert-dialog-DZdbzXAK.js";import"./button-BCdrd53b.js";import"./utils-BQHNewu7.js";import"./index-hj0mz0Tz.js";import"./index-BBiVvtg2.js";import"./index-Ci5-l5Q-.js";import"./index-BSncwmj-.js";import"./index-DX_CfHWP.js";import"./index-DYDHAuo-.js";import"./useRxDB-IkdUIFFW.js";import"./useTranslation-CrpO01Cs.js";import"./index-H9yaFe11.js";import"./x-B9EY4Ecd.js";import"./createLucideIcon-DdrGRWsG.js";import"./game-colors-Cy8IxB7V.js";const m={rounds:[{id:"r1",prompt:{en:"Sort the numbers"},correctAnswer:"1"}]},d={gameId:"theme-showcase",title:{en:"Theme Showcase"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:0,score:0,streak:0,retryCount:0,content:m,currentRound:{roundId:"r1",answer:null,hintsUsed:0}},u={profileId:"storybook-user",gameId:"theme-showcase",gradeBand:"year1-2",seed:"storybook-seed",initialContent:m,initialState:n},h=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],g=()=>e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsx(a,{title:"Sort Numbers",customGameName:"Easy Numbers",customGameColor:"teal"}),e.jsx(a,{title:"Word Spell",subject:"reading"}),e.jsx(l,{fields:h,config:{inputMethod:"drag",totalRounds:8,ttsEnabled:!0},onChange:()=>{}})]}),z={component:c,title:"Pages/ThemeShowcase",tags:["autodocs"],decorators:[i,p],parameters:{layout:"fullscreen"},args:{config:d,moves:{},initialState:n,sessionId:"showcase-session",meta:u,children:e.jsx(g,{})}},r={parameters:{globals:{theme:"light"}}},t={parameters:{globals:{theme:"dark"}}},o={parameters:{globals:{theme:"forest-light"}}},s={parameters:{globals:{theme:"forest-dark"}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'light'
    }
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'dark'
    }
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'forest-light'
    }
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'forest-dark'
    }
  }
}`,...s.parameters?.docs?.source}}};const H=["OceanLight","OceanDark","ForestLight","ForestDark"];export{s as ForestDark,o as ForestLight,t as OceanDark,r as OceanLight,H as __namedExportsOrder,z as default};
