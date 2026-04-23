import{j as e}from"./iframe-tauurkDR.js";import{w as i}from"./withDb-DBoM1Lrv.js";import{w as p}from"./withRouter-BNs9Dn-A.js";import{C as l}from"./ConfigFormFields-IaoMWkqK.js";import{G as c}from"./GameShell-BgqpPqLu.js";import{G as a}from"./GameNameChip-rKWmpXI-.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Dv389bcu.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DOZ79xFA.js";import"./index-CEhCxiZX.js";import"./index-B4NQMhfr.js";import"./alert-dialog-CEcaAqmb.js";import"./button-D0knDdgf.js";import"./utils-BQHNewu7.js";import"./index-DwbWrQ-l.js";import"./index-BzGpDt0b.js";import"./index-DPwaEhOR.js";import"./index-ChO9gRs0.js";import"./index-DJZ6UqxU.js";import"./index-CS19GxcW.js";import"./useRxDB-DwTmY3H6.js";import"./useTranslation-2pIKpgdj.js";import"./index-DlUHTGap.js";import"./createLucideIcon-Wc_LyiAW.js";import"./game-colors-C1em2IQR.js";const m={rounds:[{id:"r1",prompt:{en:"Sort the numbers"},correctAnswer:"1"}]},d={gameId:"theme-showcase",title:{en:"Theme Showcase"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:0,score:0,streak:0,retryCount:0,content:m,currentRound:{roundId:"r1",answer:null,hintsUsed:0}},u={profileId:"storybook-user",gameId:"theme-showcase",gradeBand:"year1-2",seed:"storybook-seed",initialContent:m,initialState:n},h=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],g=()=>e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsx(a,{title:"Sort Numbers",customGameName:"Easy Numbers",customGameColor:"teal"}),e.jsx(a,{title:"Word Spell",subject:"reading"}),e.jsx(l,{fields:h,config:{inputMethod:"drag",totalRounds:8,ttsEnabled:!0},onChange:()=>{}})]}),W={component:c,title:"Pages/ThemeShowcase",tags:["autodocs"],decorators:[i,p],parameters:{layout:"fullscreen"},args:{config:d,moves:{},initialState:n,sessionId:"showcase-session",meta:u,children:e.jsx(g,{})}},r={parameters:{globals:{theme:"light"}}},t={parameters:{globals:{theme:"dark"}}},o={parameters:{globals:{theme:"forest-light"}}},s={parameters:{globals:{theme:"forest-dark"}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const q=["OceanLight","OceanDark","ForestLight","ForestDark"];export{s as ForestDark,o as ForestLight,t as OceanDark,r as OceanLight,q as __namedExportsOrder,W as default};
