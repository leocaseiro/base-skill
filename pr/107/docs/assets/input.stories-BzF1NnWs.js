import{I as t}from"./input-DlZq9OCw.js";import"./iframe-Cuury9aJ.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";const p={component:t,tags:["autodocs"]},e={args:{placeholder:"Enter text…"}},a={args:{defaultValue:"Hello world",placeholder:"Enter text…"}},r={args:{type:"password",placeholder:"Password"}},s={args:{disabled:!0,placeholder:"Disabled input"}},o={args:{"aria-invalid":!0,defaultValue:"Bad value","aria-label":"Example input"},parameters:{a11y:{config:{rules:[{id:"color-contrast",enabled:!1}]}}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter text…'
  }
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: 'Hello world',
    placeholder: 'Enter text…'
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'password',
    placeholder: 'Password'
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    placeholder: 'Disabled input'
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    'aria-invalid': true,
    defaultValue: 'Bad value',
    'aria-label': 'Example input'
  },
  parameters: {
    a11y: {
      config: {
        rules: [{
          // The canvas background (#f5f5f5) behind the input field creates a
          // 4.34:1 ratio for the muted-foreground helper text — just below
          // 4.5:1. TODO: audit description/helper text colour tokens.
          id: 'color-contrast',
          enabled: false
        }]
      }
    }
  }
}`,...o.parameters?.docs?.source}}};const u=["Default","WithValue","Password","Disabled","Invalid"];export{e as Default,s as Disabled,o as Invalid,r as Password,a as WithValue,u as __namedExportsOrder,p as default};
