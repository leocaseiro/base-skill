import{j as e}from"./iframe-DHWYTY14.js";import{w as i}from"./withDb-zNgcHOQy.js";import{w as p}from"./withRouter-DOA44UR1.js";import{C as l}from"./ConfigFormFields-Bko7PJ0s.js";import{G as c}from"./GameShell-CFwDP4nW.js";import{G as a}from"./GameNameChip-XVOdqFtg.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-b9tdcsdZ.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./useNavigate-Bn8dap8r.js";import"./index-CgXnBekj.js";import"./index-D5xHRla3.js";import"./index-D27nWwse.js";import"./alert-dialog-Bvh9NHay.js";import"./button-BHkjD6QO.js";import"./utils-BQHNewu7.js";import"./index-DNqoS1gB.js";import"./index-B2hkm2w5.js";import"./index-bJViamuv.js";import"./index-B-hXsSGA.js";import"./index-BeACLGbu.js";import"./index-C0tGXQSd.js";import"./useRxDB-BvrlX4Em.js";import"./useTranslation-DXK-2lAF.js";import"./index-BVunHb9l.js";import"./createLucideIcon-DP0X2wSG.js";import"./game-colors-C1em2IQR.js";const m={rounds:[{id:"r1",prompt:{en:"Sort the numbers"},correctAnswer:"1"}]},d={gameId:"theme-showcase",title:{en:"Theme Showcase"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:0,score:0,streak:0,retryCount:0,content:m,currentRound:{roundId:"r1",answer:null,hintsUsed:0}},u={profileId:"storybook-user",gameId:"theme-showcase",gradeBand:"year1-2",seed:"storybook-seed",initialContent:m,initialState:n},h=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],g=()=>e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsx(a,{title:"Sort Numbers",customGameName:"Easy Numbers",customGameColor:"teal"}),e.jsx(a,{title:"Word Spell",subject:"reading"}),e.jsx(l,{fields:h,config:{inputMethod:"drag",totalRounds:8,ttsEnabled:!0},onChange:()=>{}})]}),q={component:c,title:"Pages/ThemeShowcase",tags:["autodocs"],decorators:[i,p],parameters:{layout:"fullscreen"},args:{config:d,moves:{},initialState:n,sessionId:"showcase-session",meta:u,children:e.jsx(g,{})}},r={parameters:{globals:{theme:"light"}}},t={parameters:{globals:{theme:"dark"}}},o={parameters:{globals:{theme:"forest-light"}}},s={parameters:{globals:{theme:"forest-dark"}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
