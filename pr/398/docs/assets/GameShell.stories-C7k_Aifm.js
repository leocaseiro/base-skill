import{j as n}from"./iframe-D_DuPu7C.js";import{w as d}from"./withRouter-Du0SJAJt.js";import{G as c}from"./GameShell-BBFpfxK9.js";import{D as p,c as l}from"./DbProvider-DM8jxCYp.js";import"./preload-helper-PPVm8Dsz.js";import"./index-t5mePuXQ.js";import"./index-CtqGL2lc.js";import"./index-CZHM5t-8.js";import"./useLocation-845iCooq.js";import"./AppMenuPanel-BQ4gkrC7.js";import"./label-C2J3-qw5.js";import"./utils-BQHNewu7.js";import"./index-2HPA599o.js";import"./index-DP6rE2MS.js";import"./select-C3GdG8sz.js";import"./createLucideIcon-B8RDRdUx.js";import"./index-D5EgVAQ4.js";import"./index-DKTy1VVi.js";import"./index-JvF1GcKW.js";import"./index-DL3l1FTI.js";import"./tslib.es6--Hu8dhvm.js";import"./index-Dq50bvxs.js";import"./slider-BAjhYyLE.js";import"./useSettings-Bqd_-wGT.js";import"./useRxQuery-DPcNv5nS.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-BRhFdrT1.js";import"./index-BNhbrhrg.js";import"./ThemeToggle-Cep0EPW9.js";import"./sheet-zn9ihzQg.js";import"./button-iITiuP-h.js";import"./x-CRuJZVR6.js";import"./index-BGinJB4J.js";import"./index-B98B0kOX.js";import"./menu-B660gTua.js";import"./alert-dialog-Crt1Em8f.js";import"./maximize-TUBDZ7B9.js";import"./import-wrapper-prod-CIOY-Xfz.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},s={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:s},er={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},r={args:{config:a,moves:{},initialState:s,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},e={args:{...r.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...r.args,sessionId:"storybook-session-004",initialState:{...s,roundIndex:0,score:0,streak:0}}},t={args:{...r.args,sessionId:"storybook-session-005",initialState:{...s,roundIndex:2,score:2,streak:2}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
