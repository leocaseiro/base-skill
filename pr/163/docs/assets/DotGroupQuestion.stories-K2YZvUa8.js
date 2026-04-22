import{j as s}from"./iframe-BDXfX0fV.js";import{w as n}from"./withDb-BuhtCUOo.js";import{w as p}from"./withRouter-j3Om3Slp.js";import{D as i}from"./DotGroupQuestion-B3-Znp4x.js";import{A as m}from"./AnswerGameProvider-tCu4NkJD.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Pnl2oSH7.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BqK0iQ5P.js";import"./index-BrIWTUQf.js";import"./index-BSr4dzqT.js";import"./useGameTTS-CKh_e30f.js";import"./useSettings-B4-7vnwT.js";import"./useRxDB-DXXe0EKs.js";import"./useRxQuery-Cbrq78u5.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DiHyDnT9.js";import"./index-QfR39EVi.js";import"./AudioFeedback-DxUgBcwr.js";const c={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},F={component:i,tags:["autodocs"],decorators:[n,p,a=>s.jsx(m,{config:c,children:s.jsx(a,{})})],parameters:{docs:{description:{component:"Renders a group of individually tappable dots. Tapping a dot assigns it the next sequential count (1, 2, 3…), overlays the number on the dot, and speaks the cardinal word aloud. Resets when `count` changes."}}}},o={args:{count:1,prompt:"one"}},r={args:{count:3,prompt:"three"}},t={args:{count:5,prompt:"five"}},e={args:{count:9,prompt:"nine"}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...e.parameters?.docs?.source}}};const G=["OneDot","ThreeDots","FiveDots","NineDots"];export{t as FiveDots,e as NineDots,o as OneDot,r as ThreeDots,G as __namedExportsOrder,F as default};
