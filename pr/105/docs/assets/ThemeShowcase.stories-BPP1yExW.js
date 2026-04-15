import{j as e}from"./iframe-2OVB56Q-.js";import{w as p}from"./withDb-DH1Pt8SY.js";import{w as l}from"./withRouter-CPnP97Ru.js";import{C as c}from"./ConfigFormFields-BZaIKuuA.js";import{G as d}from"./GameShell-B9QxtMBy.js";import{G as a}from"./GameNameChip-DS5yBQqX.js";import{S as u}from"./SavedConfigChip-DK9T1IkD.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-C4zsb6kA.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-B3BZJZKS.js";import"./index-9nVWehN-.js";import"./index-A5pMhHSI.js";import"./alert-dialog-C16epkwd.js";import"./button-Bjs5FCcN.js";import"./utils-BQHNewu7.js";import"./index-Cm-bBdPN.js";import"./index-BuDQWlHv.js";import"./index-B8DBrnNY.js";import"./index-CMaahVJa.js";import"./index-BnHL_ncX.js";import"./index-B6XeJEpq.js";import"./useRxDB-BOaLPnhc.js";import"./useTranslation-gc6_NG_E.js";import"./index-B7oOw7Jn.js";import"./createLucideIcon-BVjdCZOl.js";import"./bookmark-colors-Wuas97gq.js";import"./config-tags-D6T5qQ_Q.js";const m={rounds:[{id:"r1",prompt:{en:"Sort the numbers"},correctAnswer:"1"}]},h={gameId:"theme-showcase",title:{en:"Theme Showcase"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},i={phase:"playing",roundIndex:0,score:0,streak:0,retryCount:0,content:m,currentRound:{roundId:"r1",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"theme-showcase",gradeBand:"year1-2",seed:"storybook-seed",initialContent:m,initialState:i},b={id:"cfg-showcase",profileId:"anonymous",gameId:"sort-numbers",name:"Easy Numbers",config:{totalRounds:8,inputMethod:"drag"},createdAt:new Date().toISOString(),color:"teal"},n=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],f=()=>e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsx(a,{title:"Sort Numbers",bookmarkName:"Easy Numbers",bookmarkColor:"teal"}),e.jsx(a,{title:"Word Spell",subject:"reading"}),e.jsx(u,{doc:b,configFields:n,onPlay:()=>{},onDelete:()=>{},onSave:async()=>{}}),e.jsx(c,{fields:n,config:{inputMethod:"drag",totalRounds:8,ttsEnabled:!0},onChange:()=>{}})]}),K={component:d,title:"Pages/ThemeShowcase",tags:["autodocs"],decorators:[p,l],parameters:{layout:"fullscreen"},args:{config:h,moves:{},initialState:i,sessionId:"showcase-session",meta:g,children:e.jsx(f,{})}},o={parameters:{globals:{theme:"light"}}},r={parameters:{globals:{theme:"dark"}}},t={parameters:{globals:{theme:"forest-light"}}},s={parameters:{globals:{theme:"forest-dark"}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'light'
    }
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'dark'
    }
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'forest-light'
    }
  }
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'forest-dark'
    }
  }
}`,...s.parameters?.docs?.source}}};const Q=["OceanLight","OceanDark","ForestLight","ForestDark"];export{s as ForestDark,t as ForestLight,r as OceanDark,o as OceanLight,Q as __namedExportsOrder,K as default};
