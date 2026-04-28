import{w as n}from"./iframe-BrcFHF6J.js";import{C as l}from"./ConfigFormFields-CnwM2bzM.js";import"./preload-helper-PPVm8Dsz.js";const i=[{type:"select",key:"mode",label:"Mode",options:[{value:"picture",label:"Picture"},{value:"text",label:"Text"}]},{type:"number",key:"totalRounds",label:"Total rounds",min:1,max:20},{type:"checkbox",key:"ttsEnabled",label:"Text-to-speech"}],m={component:l,tags:["autodocs"],args:{fields:i,config:{mode:"picture",totalRounds:8,ttsEnabled:!0},onChange:()=>{}},argTypes:{onChange:{action:"changed"}}},e={},s={decorators:[n]},t=[{type:"nested-select",key:"skip",subKey:"mode",label:"Skip mode",options:[{value:"random",label:"random"},{value:"consecutive",label:"consecutive"},{value:"by",label:"by"}]},{type:"nested-number",key:"skip",subKey:"step",label:"Skip step",min:2,max:100,visibleWhen:{key:"skip",subKey:"mode",value:"by"}},{type:"nested-select",key:"skip",subKey:"start",label:"Skip start",options:[{value:"range-min",label:"range-min"},{value:"random",label:"random"}],visibleWhen:{key:"skip",subKey:"mode",value:"by"}},{type:"select",key:"tileBankMode",label:"Tile bank mode",options:[{value:"exact",label:"exact"},{value:"distractors",label:"distractors"}]},{type:"nested-select",key:"distractors",subKey:"source",label:"Distractor source",options:[{value:"random",label:"random"},{value:"gaps-only",label:"gaps-only"},{value:"full-range",label:"full-range"}],visibleWhen:{key:"tileBankMode",value:"distractors"}},{type:"nested-select-or-number",key:"distractors",subKey:"count",label:"Distractor count",min:1,max:20,visibleWhen:{key:"tileBankMode",value:"distractors"}}],a={args:{fields:t,config:{skip:{mode:"random"},tileBankMode:"exact",distractors:{source:"random",count:2}}}},o={args:{fields:t,config:{skip:{mode:"by",step:5,start:"range-min"},tileBankMode:"exact",distractors:{source:"random",count:2}}}},r={args:{fields:t,config:{skip:{mode:"random"},tileBankMode:"distractors",distractors:{source:"gaps-only",count:3}}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  decorators: [withDarkMode]
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    fields: sortFields,
    config: {
      skip: {
        mode: 'random'
      },
      tileBankMode: 'exact',
      distractors: {
        source: 'random',
        count: 2
      }
    }
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    fields: sortFields,
    config: {
      skip: {
        mode: 'by',
        step: 5,
        start: 'range-min'
      },
      tileBankMode: 'exact',
      distractors: {
        source: 'random',
        count: 2
      }
    }
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    fields: sortFields,
    config: {
      skip: {
        mode: 'random'
      },
      tileBankMode: 'distractors',
      distractors: {
        source: 'gaps-only',
        count: 3
      }
    }
  }
}`,...r.parameters?.docs?.source}}};const p=["AllFieldTypes","AllFieldTypesDark","SortNumbersFieldsExact","SortNumbersFieldsByMode","SortNumbersFieldsDistractors"];export{e as AllFieldTypes,s as AllFieldTypesDark,o as SortNumbersFieldsByMode,r as SortNumbersFieldsDistractors,a as SortNumbersFieldsExact,p as __namedExportsOrder,m as default};
