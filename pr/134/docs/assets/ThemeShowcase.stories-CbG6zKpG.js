import{j as e}from"./iframe-DEygXkeu.js";import{w as i}from"./withDb-DvTSVtMM.js";import{w as p}from"./withRouter-BkZLgsz6.js";import{C as l}from"./ConfigFormFields-BV50ONFk.js";import{G as c}from"./GameShell-BfxBMNbL.js";import{G as a}from"./GameNameChip-CvJUxbIY.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Dj1X7qgI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-704n2CJO.js";import"./index-t_Z-1JV_.js";import"./index-gk5iekGs.js";import"./alert-dialog-D3gkKW7S.js";import"./button-BcPwe4UV.js";import"./utils-BQHNewu7.js";import"./index-B9vmWRAa.js";import"./index-BArdXIej.js";import"./index-C17ruVI0.js";import"./index-a7gil0J9.js";import"./index-BRLj5fKB.js";import"./index-DeTcLa0c.js";import"./useRxDB-B4bBehY6.js";import"./useTranslation-D6nfEgDz.js";import"./index-CbOQmIFs.js";import"./createLucideIcon-BlsRn39E.js";import"./game-colors-C1em2IQR.js";const m={rounds:[{id:"r1",prompt:{en:"Sort the numbers"},correctAnswer:"1"}]},d={gameId:"theme-showcase",title:{en:"Theme Showcase"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:0,score:0,streak:0,retryCount:0,content:m,currentRound:{roundId:"r1",answer:null,hintsUsed:0}},u={profileId:"storybook-user",gameId:"theme-showcase",gradeBand:"year1-2",seed:"storybook-seed",initialContent:m,initialState:n},h=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],g=()=>e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsx(a,{title:"Sort Numbers",customGameName:"Easy Numbers",customGameColor:"teal"}),e.jsx(a,{title:"Word Spell",subject:"reading"}),e.jsx(l,{fields:h,config:{inputMethod:"drag",totalRounds:8,ttsEnabled:!0},onChange:()=>{}})]}),W={component:c,title:"Pages/ThemeShowcase",tags:["autodocs"],decorators:[i,p],parameters:{layout:"fullscreen"},args:{config:d,moves:{},initialState:n,sessionId:"showcase-session",meta:u,children:e.jsx(g,{})}},r={parameters:{globals:{theme:"light"}}},t={parameters:{globals:{theme:"dark"}}},o={parameters:{globals:{theme:"forest-light"}}},s={parameters:{globals:{theme:"forest-dark"}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
