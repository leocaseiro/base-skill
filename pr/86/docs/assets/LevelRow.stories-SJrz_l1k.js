import{j as t}from"./iframe-Br7nSF68.js";import{B as c}from"./button-C3AlEQl5.js";import{u as m}from"./useTranslation-BYIznbLo.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-Ce-uy6Xk.js";import"./index-YagfcMVX.js";const d=["PK","K","1","2","3","4"],i=({currentLevel:r,onLevelChange:o})=>{const{t:l}=m("common");return t.jsxs("div",{className:"flex gap-2 overflow-x-auto py-3 px-4 scrollbar-none",role:"group","aria-label":"Filter by grade level",children:[t.jsx(c,{variant:r===""?"default":"outline",size:"sm","aria-pressed":r==="",onClick:()=>o(""),children:l("levels.all")}),d.map(e=>t.jsx(c,{variant:r===e?"default":"outline",size:"sm","aria-pressed":r===e,onClick:()=>o(e),children:l(`levels.${e}`)},e))]})};i.__docgenInfo={description:"",methods:[],displayName:"LevelRow",props:{currentLevel:{required:!0,tsType:{name:"union",raw:"GameLevel | ''",elements:[{name:"GameLevel"},{name:"literal",value:"''"}]},description:""},onLevelChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(level: GameLevel | '') => void",signature:{arguments:[{type:{name:"union",raw:"GameLevel | ''",elements:[{name:"GameLevel"},{name:"literal",value:"''"}]},name:"level"}],return:{name:"void"}}},description:""}}};const S={component:i,tags:["autodocs"],args:{currentLevel:""},argTypes:{onLevelChange:{action:"levelChanged"}}},a={args:{currentLevel:""}},s={args:{currentLevel:"K"}},n={args:{currentLevel:"3"}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    currentLevel: ''
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    currentLevel: 'K'
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    currentLevel: '3'
  }
}`,...n.parameters?.docs?.source}}};const y=["AllSelected","KindergartenSelected","Grade3Selected"];export{a as AllSelected,n as Grade3Selected,s as KindergartenSelected,y as __namedExportsOrder,S as default};
