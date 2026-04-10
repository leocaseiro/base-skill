import{w as s}from"./decorators-BPXgsXkU.js";import{S as c}from"./SavedConfigChip-DG3kRjfE.js";import"./iframe-shi_d_H9.js";import"./preload-helper-PPVm8Dsz.js";import"./ConfigFormFields-BsTBLEIe.js";import"./bookmark-colors-Wuas97gq.js";import"./config-tags-D6T5qQ_Q.js";const t={id:"cfg-1",profileId:"anonymous",gameId:"word-spell",name:"Easy Mode",config:{inputMethod:"drag",totalRounds:8,mode:"picture"},createdAt:new Date().toISOString(),color:"indigo"},n=[{type:"select",key:"inputMethod",label:"Input method",options:[{value:"drag",label:"Drag"},{value:"type",label:"Type"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20}],D={component:c,tags:["autodocs"],args:{doc:t,configFields:n,onPlay:()=>{},onDelete:()=>{},onSave:async()=>{}},argTypes:{onPlay:{action:"played"},onDelete:{action:"deleted"},onSave:{action:"saved"}}},o={},e={decorators:[s]},a={args:{doc:{...t,color:"teal"}}},r={args:{doc:{...t,color:"teal"}},decorators:[s]};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:"{}",...o.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  decorators: [withDarkMode]
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    doc: {
      ...mockDoc,
      color: 'teal'
    }
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    doc: {
      ...mockDoc,
      color: 'teal'
    }
  },
  decorators: [withDarkMode]
}`,...r.parameters?.docs?.source}}};const y=["Collapsed","CollapsedDark","TealColor","TealColorDark"];export{o as Collapsed,e as CollapsedDark,a as TealColor,r as TealColorDark,y as __namedExportsOrder,D as default};
