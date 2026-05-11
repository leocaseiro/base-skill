import{j as n}from"./iframe-CAseeJZD.js";import{w as d}from"./withRouter-CGpzoYaL.js";import{G as c}from"./GameShell-DyK4wi6V.js";import{D as p,c as l}from"./DbProvider-CKoPm2eD.js";import"./preload-helper-PPVm8Dsz.js";import"./index-B4BZ40xN.js";import"./index-BQ8VWtcB.js";import"./index-uXrqNUPK.js";import"./useLocation-BpOT8pbo.js";import"./AppMenuPanel-QpWQYaFR.js";import"./label-heg363fB.js";import"./utils-BQHNewu7.js";import"./index-Bp_j30cN.js";import"./index-BTPtL_1u.js";import"./select-BtdOWavU.js";import"./createLucideIcon-DhNVX-h8.js";import"./index-C72bT9c8.js";import"./index-DvM4mdpu.js";import"./index-ClezXYZE.js";import"./index-sXs4gwrb.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BdpYGhDC.js";import"./slider-BLf7lR9D.js";import"./useSettings-DE0Iyu2D.js";import"./useRxQuery-aa_fggiV.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DojqdafW.js";import"./index-Bk5dYmwc.js";import"./ThemeToggle-BLkvboYQ.js";import"./sheet-mfBWmzcC.js";import"./button-CFexva36.js";import"./index-DI32KStU.js";import"./index-B-ygVML0.js";import"./alert-dialog-Sw_W4Cei.js";import"./import-wrapper-prod-DnwmkNRu.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
