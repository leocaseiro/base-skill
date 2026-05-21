import{j as n}from"./iframe-BMq_Qhig.js";import{w as d}from"./withRouter-NtPs30NC.js";import{G as c}from"./GameShell-BhvnpRhP.js";import{D as p,c as l}from"./DbProvider-wYh7-5iY.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CdkWd9Lu.js";import"./index-nUZ7Cb2g.js";import"./index-JM3K_OYG.js";import"./useLocation-DmrDDz9H.js";import"./AppMenuPanel-uO-wl9cP.js";import"./label-l9ucSNN1.js";import"./utils-BQHNewu7.js";import"./index-CtDEGI7q.js";import"./index-CX3ajNmK.js";import"./select-CdWis7ix.js";import"./createLucideIcon-uNoiXiGS.js";import"./index-CcUMXy7k.js";import"./index-uzy8Ge_v.js";import"./index-0196AXhP.js";import"./index-DmpqiFkE.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CZlrsYpc.js";import"./slider-DoJRmR2o.js";import"./useSettings-B6mgyiYB.js";import"./useRxQuery-DcpdC9uq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-C4s_Is2K.js";import"./index-D8FomG49.js";import"./ThemeToggle-CcmhVFVr.js";import"./sheet-ikiZjjzB.js";import"./button-gCG4oTkJ.js";import"./index-DT_qSNPA.js";import"./index-CxvImheS.js";import"./alert-dialog-DqdZRmm9.js";import"./import-wrapper-prod-BcExgIXg.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
