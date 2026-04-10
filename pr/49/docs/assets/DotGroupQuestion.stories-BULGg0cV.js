import{j as s}from"./iframe-D3E2on1e.js";import{w as n}from"./withDb-DTVP_IDt.js";import{w as p}from"./withRouter-CQEnqSzx.js";import{D as i}from"./DotGroupQuestion-rXGd7GVr.js";import{A as m}from"./AnswerGameProvider-HdEKte-P.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BX52Cuwf.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CgHij0PC.js";import"./index-DxOaURgz.js";import"./index-DfSaqrFa.js";import"./useGameTTS-COwATXae.js";import"./useSettings-vy9DZBNs.js";import"./useRxDB-DbMJKqeJ.js";import"./useRxQuery-DILFSkUg.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-CpZa6q_3.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-TWIScEwh.js";const c={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},G={component:i,tags:["autodocs"],decorators:[n,p,a=>s.jsx(m,{config:c,children:s.jsx(a,{})})],parameters:{docs:{description:{component:"Renders a group of individually tappable dots. Tapping a dot assigns it the next sequential count (1, 2, 3…), overlays the number on the dot, and speaks the cardinal word aloud. Resets when `count` changes."}}}},o={args:{count:1,prompt:"one"}},r={args:{count:3,prompt:"three"}},t={args:{count:5,prompt:"five"}},e={args:{count:9,prompt:"nine"}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    count: 1,
    prompt: 'one'
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    count: 3,
    prompt: 'three'
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    count: 5,
    prompt: 'five'
  }
}`,...t.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    count: 9,
    prompt: 'nine'
  }
}`,...e.parameters?.docs?.source}}};const M=["OneDot","ThreeDots","FiveDots","NineDots"];export{t as FiveDots,e as NineDots,o as OneDot,r as ThreeDots,M as __namedExportsOrder,G as default};
