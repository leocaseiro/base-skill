import{j as s}from"./iframe-IXe6LyCx.js";import{w as n}from"./withDb-DrHL5OmH.js";import{w as p}from"./withRouter-DZtqd-mD.js";import{D as i}from"./DotGroupQuestion-80n_kvtw.js";import{A as m}from"./AnswerGameProvider-B0JJ3sox.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BiET_O8z.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-D7hi7WAV.js";import"./index-vcUn9Dvj.js";import"./index-CgGIUkyc.js";import"./useGameTTS-CJCHC0yg.js";import"./useSettings-O5WY2dme.js";import"./useRxDB-DMA5PL8-.js";import"./useRxQuery-lV9BlHKX.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-Cgz9Ew_8.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-DhA4C_Br.js";const c={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},G={component:i,tags:["autodocs"],decorators:[n,p,a=>s.jsx(m,{config:c,children:s.jsx(a,{})})],parameters:{docs:{description:{component:"Renders a group of individually tappable dots. Tapping a dot assigns it the next sequential count (1, 2, 3…), overlays the number on the dot, and speaks the cardinal word aloud. Resets when `count` changes."}}}},o={args:{count:1,prompt:"one"}},r={args:{count:3,prompt:"three"}},t={args:{count:5,prompt:"five"}},e={args:{count:9,prompt:"nine"}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
