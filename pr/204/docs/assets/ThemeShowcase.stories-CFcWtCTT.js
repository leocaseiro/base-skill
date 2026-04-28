import{j as e}from"./iframe-BrcFHF6J.js";import{w as i}from"./withDb-BGBSiar0.js";import{w as p}from"./withRouter-aAZCaMc3.js";import{C as l}from"./ConfigFormFields-CnwM2bzM.js";import{G as c}from"./GameShell-CK4Q2Zl2.js";import{G as a}from"./GameNameChip-beheu3r6.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BYtdWlyX.js";import"./index.browser-BY9c7rfI.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-ez1CnBjM.js";import"./index-Bb223Eso.js";import"./index-DOebWZdZ.js";import"./alert-dialog-BJrKr4oc.js";import"./button-Ddl5QNO4.js";import"./utils-BQHNewu7.js";import"./index-DExYQQb1.js";import"./index-CIvYhAWB.js";import"./index-o69bUa-d.js";import"./index-CeeMSG7c.js";import"./index-CvNMUAsj.js";import"./index-B6JE6Ef0.js";import"./useRxDB-D3vI47MC.js";import"./useTranslation-DP7VYnB1.js";import"./index-Bx_xtlwH.js";import"./x-2Y-lwSM4.js";import"./createLucideIcon-CFFFfDen.js";import"./game-colors-Cy8IxB7V.js";const m={rounds:[{id:"r1",prompt:{en:"Sort the numbers"},correctAnswer:"1"}]},d={gameId:"theme-showcase",title:{en:"Theme Showcase"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:0,score:0,streak:0,retryCount:0,content:m,currentRound:{roundId:"r1",answer:null,hintsUsed:0}},u={profileId:"storybook-user",gameId:"theme-showcase",gradeBand:"year1-2",seed:"storybook-seed",initialContent:m,initialState:n},h=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],g=()=>e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsx(a,{title:"Sort Numbers",customGameName:"Easy Numbers",customGameColor:"teal"}),e.jsx(a,{title:"Word Spell",subject:"reading"}),e.jsx(l,{fields:h,config:{inputMethod:"drag",totalRounds:8,ttsEnabled:!0},onChange:()=>{}})]}),z={component:c,title:"Pages/ThemeShowcase",tags:["autodocs"],decorators:[i,p],parameters:{layout:"fullscreen"},args:{config:d,moves:{},initialState:n,sessionId:"showcase-session",meta:u,children:e.jsx(g,{})}},r={parameters:{globals:{theme:"light"}}},t={parameters:{globals:{theme:"dark"}}},o={parameters:{globals:{theme:"forest-light"}}},s={parameters:{globals:{theme:"forest-dark"}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
