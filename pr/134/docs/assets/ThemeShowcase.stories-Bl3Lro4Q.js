import{j as e}from"./iframe-Bh2nVCMs.js";import{w as i}from"./withDb-vxhz28xH.js";import{w as p}from"./withRouter-Cosq7kFd.js";import{C as l}from"./ConfigFormFields-Dvy4Itsl.js";import{G as c}from"./GameShell-KpzHJi1j.js";import{G as a}from"./GameNameChip-CRotQCVd.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-ZCNfSOnL.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-cJCqS7oj.js";import"./index-BfJ4OZfw.js";import"./index-POS1z8_U.js";import"./alert-dialog-ClQaj4Lj.js";import"./button-CLh-HIBk.js";import"./utils-BQHNewu7.js";import"./index-DXmi2Q2E.js";import"./index-BPQwT_yf.js";import"./index-tr5_ru8O.js";import"./index-VqHmFpyu.js";import"./index-8unbytqM.js";import"./index-QmrKJt9Z.js";import"./useRxDB-DMNzw4Mg.js";import"./useTranslation-LTttj4Vo.js";import"./index-BGDalHPA.js";import"./createLucideIcon-BXzn3u3Y.js";import"./game-colors-C1em2IQR.js";const m={rounds:[{id:"r1",prompt:{en:"Sort the numbers"},correctAnswer:"1"}]},d={gameId:"theme-showcase",title:{en:"Theme Showcase"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:0,score:0,streak:0,retryCount:0,content:m,currentRound:{roundId:"r1",answer:null,hintsUsed:0}},u={profileId:"storybook-user",gameId:"theme-showcase",gradeBand:"year1-2",seed:"storybook-seed",initialContent:m,initialState:n},h=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],g=()=>e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsx(a,{title:"Sort Numbers",customGameName:"Easy Numbers",customGameColor:"teal"}),e.jsx(a,{title:"Word Spell",subject:"reading"}),e.jsx(l,{fields:h,config:{inputMethod:"drag",totalRounds:8,ttsEnabled:!0},onChange:()=>{}})]}),W={component:c,title:"Pages/ThemeShowcase",tags:["autodocs"],decorators:[i,p],parameters:{layout:"fullscreen"},args:{config:d,moves:{},initialState:n,sessionId:"showcase-session",meta:u,children:e.jsx(g,{})}},r={parameters:{globals:{theme:"light"}}},t={parameters:{globals:{theme:"dark"}}},o={parameters:{globals:{theme:"forest-light"}}},s={parameters:{globals:{theme:"forest-dark"}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
