import{j as n}from"./iframe-BrEdAlTE.js";import{w as d}from"./withRouter-C04F8PnV.js";import{G as c}from"./GameShell-DXdfOIRQ.js";import{D as p,c as l}from"./DbProvider-BCwEnOSl.js";import"./preload-helper-PPVm8Dsz.js";import"./index-Bf_ahZRo.js";import"./index-BELskMKd.js";import"./index-CSXW3dtf.js";import"./useLocation-FkADsIST.js";import"./AppMenuPanel-SdJOborW.js";import"./label-DwvvwKQ7.js";import"./utils-BQHNewu7.js";import"./index-EhjKkGB6.js";import"./index-990xaqK1.js";import"./select-DyBsOcfj.js";import"./createLucideIcon-BZ917FPL.js";import"./index-CdMtCiiC.js";import"./index-cvsX3ZXs.js";import"./index-D2zRvRZd.js";import"./index-L3qMHFOs.js";import"./tslib.es6--Hu8dhvm.js";import"./index-_1CZrTmm.js";import"./slider-CDMybMV8.js";import"./useSettings-dsqysVZ6.js";import"./useRxQuery-BKAcNfih.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-BqgrIjap.js";import"./index-DMKXQQJ5.js";import"./ThemeToggle-BvSl7v-L.js";import"./sheet-DCLoZFQO.js";import"./button-CgVhMXCD.js";import"./index-CBKbYHFX.js";import"./index-Bt762h_b.js";import"./alert-dialog-DP26WVFE.js";import"./import-wrapper-prod-H6Ecgkn4.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    config: baseConfig,
    moves: {},
    initialState,
    sessionId: 'storybook-session-001',
    meta: meta_,
    children: <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground">
        Game component renders here
      </div>
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    sessionId: 'storybook-session-002',
    config: {
      ...baseConfig,
      timerVisible: false,
      timerDurationSeconds: null
    }
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    sessionId: 'storybook-session-004',
    initialState: {
      ...initialState,
      roundIndex: 0,
      score: 0,
      streak: 0
    }
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    sessionId: 'storybook-session-005',
    initialState: {
      ...initialState,
      roundIndex: 2,
      score: 2,
      streak: 2
    }
  }
}`,...s.parameters?.docs?.source}}};const $=["Default","NoTimer","FirstRound","LastRound"];export{e as Default,o as FirstRound,s as LastRound,r as NoTimer,$ as __namedExportsOrder,Z as default};
