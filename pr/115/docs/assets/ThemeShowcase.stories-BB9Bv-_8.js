import{j as e}from"./iframe-fwnvphj5.js";import{w as i}from"./withDb-D_onW2BN.js";import{w as p}from"./withRouter-B7VMn9z_.js";import{C as l}from"./ConfigFormFields-CuHQzrTX.js";import{G as c}from"./GameShell-CVCX9fmD.js";import{G as a}from"./GameNameChip-CGT41HVv.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DSLWtbO8.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./useNavigate-DaC11qgA.js";import"./index-7PlX-QYs.js";import"./index-CQ9CgLw1.js";import"./index-D1bjDqVv.js";import"./alert-dialog-D3bp6hOw.js";import"./button-OfMc2HvO.js";import"./utils-BQHNewu7.js";import"./index-DEN2UB-r.js";import"./index-DhTY8xg8.js";import"./index-B9A0FL-6.js";import"./index-BKbwB7-7.js";import"./index-BRw6W4fv.js";import"./index-CM8bEeFM.js";import"./useRxDB-BEN_M5Tz.js";import"./useTranslation-DTjbtb9r.js";import"./index-CD4IBDDR.js";import"./createLucideIcon-BOFPvf6P.js";import"./game-colors-C1em2IQR.js";const m={rounds:[{id:"r1",prompt:{en:"Sort the numbers"},correctAnswer:"1"}]},d={gameId:"theme-showcase",title:{en:"Theme Showcase"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:0,score:0,streak:0,retryCount:0,content:m,currentRound:{roundId:"r1",answer:null,hintsUsed:0}},u={profileId:"storybook-user",gameId:"theme-showcase",gradeBand:"year1-2",seed:"storybook-seed",initialContent:m,initialState:n},h=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],g=()=>e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsx(a,{title:"Sort Numbers",customGameName:"Easy Numbers",customGameColor:"teal"}),e.jsx(a,{title:"Word Spell",subject:"reading"}),e.jsx(l,{fields:h,config:{inputMethod:"drag",totalRounds:8,ttsEnabled:!0},onChange:()=>{}})]}),q={component:c,title:"Pages/ThemeShowcase",tags:["autodocs"],decorators:[i,p],parameters:{layout:"fullscreen"},args:{config:d,moves:{},initialState:n,sessionId:"showcase-session",meta:u,children:e.jsx(g,{})}},r={parameters:{globals:{theme:"light"}}},t={parameters:{globals:{theme:"dark"}}},o={parameters:{globals:{theme:"forest-light"}}},s={parameters:{globals:{theme:"forest-dark"}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const z=["OceanLight","OceanDark","ForestLight","ForestDark"];export{s as ForestDark,o as ForestLight,t as OceanDark,r as OceanLight,z as __namedExportsOrder,q as default};
