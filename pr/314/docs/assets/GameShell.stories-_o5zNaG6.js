import{j as n}from"./iframe-CDOdHhhJ.js";import{w as d}from"./withRouter-BRw8hboN.js";import{G as c}from"./GameShell-B8ggv94k.js";import{D as p,c as l}from"./DbProvider-DqptDAzY.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CkpiWeaG.js";import"./index-cR0fI7hM.js";import"./index-BO6s0_zG.js";import"./useLocation-Dj3QcDbm.js";import"./AppMenuPanel-DWU_NBOa.js";import"./label-BDP2bKiy.js";import"./utils-BQHNewu7.js";import"./index-Bj5_Ievq.js";import"./index-MyrhlQu2.js";import"./select-BHmZBYak.js";import"./createLucideIcon-C2wQOq2C.js";import"./index-6j1ZCyP8.js";import"./index-DOwB0J3X.js";import"./index-CBR8D0Tm.js";import"./index-CHPwXxny.js";import"./tslib.es6--Hu8dhvm.js";import"./index-fG8FZKlm.js";import"./slider-BPE2HzjT.js";import"./useSettings-9B4Wjjou.js";import"./useRxQuery-ffhi7NF0.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DSWKagQS.js";import"./index-DHNEaCXp.js";import"./ThemeToggle-CRI6J8Or.js";import"./sheet-Db0FIfHl.js";import"./button-Czi9ZY-I.js";import"./index-Dsm42lhw.js";import"./index-DpScXNsE.js";import"./alert-dialog-lSOj39Mm.js";import"./import-wrapper-prod-C9_ZZirQ.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
