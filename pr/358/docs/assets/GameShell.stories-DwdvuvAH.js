import{j as n}from"./iframe-CkPn3vJ2.js";import{w as d}from"./withRouter-6-Sjp6sW.js";import{G as c}from"./GameShell-C5Y2XfFR.js";import{D as p,c as l}from"./DbProvider-DwwarorX.js";import"./preload-helper-PPVm8Dsz.js";import"./index-zzNFqja9.js";import"./index-BZ6alliE.js";import"./index-BBkMUogE.js";import"./useLocation-CXuQV9EK.js";import"./AppMenuPanel-CBV0UDz6.js";import"./label-B3p1jyg3.js";import"./utils-BQHNewu7.js";import"./index-CrS8PDYU.js";import"./index-DN0pynl4.js";import"./select-w8CT6XMo.js";import"./createLucideIcon-Cz2MJlDg.js";import"./index-CnWEELXd.js";import"./index-Cp4BhNMg.js";import"./index-wwRvIO64.js";import"./index-BqmHNYtH.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DM1s5dcT.js";import"./slider-C5AzL_SW.js";import"./useSettings-Bags7V6S.js";import"./useRxQuery-DeVmjV9s.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CDGfPrRD.js";import"./index-gedrdVCS.js";import"./ThemeToggle-DYn-hlLp.js";import"./sheet-CWIeGIds.js";import"./button-GXEKt8Ln.js";import"./index-Cfdm7lOL.js";import"./index-DGFQYCza.js";import"./alert-dialog-C_PT0lAb.js";import"./import-wrapper-prod-VYi4e1Pb.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
