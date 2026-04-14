import{j as n}from"./iframe-C-Iv9PpS.js";import{B as c}from"./button-CZxwylK1.js";import{u as m}from"./useTranslation-CgV3uvS-.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-63MqCPOH.js";import"./index-Lxk7eyX_.js";import"./index-7Dqo2xBf.js";const d=["PK","K","1","2","3","4"],i=({currentLevel:r,onLevelChange:o})=>{const{t:l}=m("common");return n.jsxs("div",{className:"flex gap-2 overflow-x-auto py-3 px-4 scrollbar-none",role:"group","aria-label":"Filter by grade level",children:[n.jsx(c,{variant:r===""?"default":"outline",size:"sm","aria-pressed":r==="",onClick:()=>o(""),children:l("levels.all")}),d.map(e=>n.jsx(c,{variant:r===e?"default":"outline",size:"sm","aria-pressed":r===e,onClick:()=>o(e),children:l(`levels.${e}`)},e))]})};i.__docgenInfo={description:"",methods:[],displayName:"LevelRow",props:{currentLevel:{required:!0,tsType:{name:"union",raw:"GameLevel | ''",elements:[{name:"GameLevel"},{name:"literal",value:"''"}]},description:""},onLevelChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(level: GameLevel | '') => void",signature:{arguments:[{type:{name:"union",raw:"GameLevel | ''",elements:[{name:"GameLevel"},{name:"literal",value:"''"}]},name:"level"}],return:{name:"void"}}},description:""}}};const y={component:i,tags:["autodocs"],args:{currentLevel:""},argTypes:{onLevelChange:{action:"levelChanged"}}},a={args:{currentLevel:""}},s={args:{currentLevel:"K"}},t={args:{currentLevel:"3"}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    currentLevel: ''
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    currentLevel: 'K'
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    currentLevel: '3'
  }
}`,...t.parameters?.docs?.source}}};const G=["AllSelected","KindergartenSelected","Grade3Selected"];export{a as AllSelected,t as Grade3Selected,s as KindergartenSelected,G as __namedExportsOrder,y as default};
