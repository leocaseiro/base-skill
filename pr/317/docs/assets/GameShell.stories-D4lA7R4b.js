import{j as n}from"./iframe-B8bhgewM.js";import{w as d}from"./withRouter-DwMG7990.js";import{G as c}from"./GameShell-BCUgqf74.js";import{D as p,c as l}from"./DbProvider-BLwPsju2.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DVuYE_OC.js";import"./index-BxyG9RXr.js";import"./index-ByT9K3cD.js";import"./useLocation-eCOpleOk.js";import"./AppMenuPanel-BrZNiDLM.js";import"./label-Dac4qUNW.js";import"./utils-BQHNewu7.js";import"./index-DjDjClcf.js";import"./index-UkD9PZx0.js";import"./select-DgJ9Fv9e.js";import"./createLucideIcon-BcfDSZgJ.js";import"./index-Cejq2mYg.js";import"./index-BVa7OkEk.js";import"./index-B_BBn1Ng.js";import"./index-jI1sXx9d.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BrydN9Un.js";import"./slider-CkxvBiV2.js";import"./useSettings-Dp1uuRjL.js";import"./useRxQuery-CrnJcrUk.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DGAyom6d.js";import"./index-DvUAX3nj.js";import"./ThemeToggle-Medf-oud.js";import"./sheet-CGFKv6Tb.js";import"./button-DKijSYlb.js";import"./x-71Q6EMXy.js";import"./index-DNcsWXw8.js";import"./index-B_eoAfcD.js";import"./menu-DVINdC7O.js";import"./alert-dialog-Cs8ero9P.js";import"./maximize-D-wTPVaT.js";import"./import-wrapper-prod-Bx9bJjtC.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},s={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:s},er={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},r={args:{config:a,moves:{},initialState:s,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},e={args:{...r.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...r.args,sessionId:"storybook-session-004",initialState:{...s,roundIndex:0,score:0,streak:0}}},t={args:{...r.args,sessionId:"storybook-session-005",initialState:{...s,roundIndex:2,score:2,streak:2}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
}`,...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    sessionId: 'storybook-session-002',
    config: {
      ...baseConfig,
      timerVisible: false,
      timerDurationSeconds: null
    }
  }
}`,...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source}}};const or=["Default","NoTimer","FirstRound","LastRound"];export{r as Default,o as FirstRound,t as LastRound,e as NoTimer,or as __namedExportsOrder,er as default};
