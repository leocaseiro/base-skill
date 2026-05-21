import{j as n}from"./iframe-jesWe3Vw.js";import{w as d}from"./withRouter-iZUQQDPF.js";import{G as c}from"./GameShell-D3X1l70a.js";import{D as p,c as l}from"./DbProvider-BmSmiqv1.js";import"./preload-helper-PPVm8Dsz.js";import"./index-07ChRRVG.js";import"./index-DplHfCTB.js";import"./index-DiN9iyvl.js";import"./useLocation-BVgy3f43.js";import"./AppMenuPanel-DCbUEpQ4.js";import"./label-DM4F8SMA.js";import"./utils-BQHNewu7.js";import"./index-CyF-G2ZA.js";import"./index-a0k_z-0y.js";import"./select-DtWmhpb8.js";import"./createLucideIcon-D0gKUMCe.js";import"./index-BJZh_re3.js";import"./index-rG7BVq6Y.js";import"./index-CrazIeZi.js";import"./index-BRWXsD3B.js";import"./tslib.es6--Hu8dhvm.js";import"./index-39sTqXXs.js";import"./slider-BVfosfka.js";import"./useSettings-CEDJg7Tt.js";import"./useRxQuery-B7EMQuJl.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-BXslwR0C.js";import"./index-C1BK8Vf7.js";import"./ThemeToggle-LWjLqaw_.js";import"./sheet-Dt9tmh64.js";import"./button-cQR-iudV.js";import"./index-C8FSPNtf.js";import"./index-VNklcnf9.js";import"./alert-dialog-C_xlu_aG.js";import"./import-wrapper-prod-B4-WR4iD.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
