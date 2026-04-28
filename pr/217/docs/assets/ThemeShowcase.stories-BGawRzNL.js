import{j as e}from"./iframe-EjnZKfRE.js";import{w as i}from"./withDb-CrwPFx8G.js";import{w as p}from"./withRouter-BcC5YhSk.js";import{C as l}from"./ConfigFormFields-CNr2YbVN.js";import{G as c}from"./GameShell-Coe8mZAS.js";import{G as a}from"./GameNameChip-DcCfrLwx.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BPQ_gQqt.js";import"./import-wrapper-prod-DXxaZYXP.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BVZYVQey.js";import"./index-B_Uibjuy.js";import"./index-HaEjstXK.js";import"./alert-dialog-lKkpQXM-.js";import"./button-D9eWfFe4.js";import"./utils-BQHNewu7.js";import"./index-rry-2HhO.js";import"./index-DqKIL3b5.js";import"./index-BgN76F8M.js";import"./index-DYktwI2o.js";import"./index-B6DyWpuO.js";import"./index-Kl7RJfP0.js";import"./useRxDB-Dzo1-iK_.js";import"./useTranslation-pggQVKJu.js";import"./index-DcqQkSqk.js";import"./x-2macmhnq.js";import"./createLucideIcon-EiYkoFus.js";import"./game-colors-Cy8IxB7V.js";const m={rounds:[{id:"r1",prompt:{en:"Sort the numbers"},correctAnswer:"1"}]},d={gameId:"theme-showcase",title:{en:"Theme Showcase"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:0,score:0,streak:0,retryCount:0,content:m,currentRound:{roundId:"r1",answer:null,hintsUsed:0}},u={profileId:"storybook-user",gameId:"theme-showcase",gradeBand:"year1-2",seed:"storybook-seed",initialContent:m,initialState:n},h=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],g=()=>e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsx(a,{title:"Sort Numbers",customGameName:"Easy Numbers",customGameColor:"teal"}),e.jsx(a,{title:"Word Spell",subject:"reading"}),e.jsx(l,{fields:h,config:{inputMethod:"drag",totalRounds:8,ttsEnabled:!0},onChange:()=>{}})]}),z={component:c,title:"Pages/ThemeShowcase",tags:["autodocs"],decorators:[i,p],parameters:{layout:"fullscreen"},args:{config:d,moves:{},initialState:n,sessionId:"showcase-session",meta:u,children:e.jsx(g,{})}},r={parameters:{globals:{theme:"light"}}},t={parameters:{globals:{theme:"dark"}}},o={parameters:{globals:{theme:"forest-light"}}},s={parameters:{globals:{theme:"forest-dark"}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
