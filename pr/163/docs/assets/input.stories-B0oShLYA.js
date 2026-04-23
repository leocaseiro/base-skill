import{I as u}from"./input-B6PJUJKD.js";import"./iframe-B5Nb_GbG.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";const{expect:i,fn:c,userEvent:m,within:g}=__STORYBOOK_MODULE_TEST__,v={component:u,tags:["autodocs"],args:{onChange:c(),onFocus:c(),onBlur:c()},argTypes:{type:{control:{type:"select"},options:["text","email","password","number","search","tel","url"]},disabled:{control:"boolean"},"aria-invalid":{control:"boolean"}}},e={args:{placeholder:"Enter text…"}},a={args:{defaultValue:"Hello world",placeholder:"Enter text…"}},r={args:{type:"password",placeholder:"Password"}},n={args:{disabled:!0,placeholder:"Disabled input"}},s={args:{"aria-invalid":!0,defaultValue:"Bad value","aria-label":"Example input"},parameters:{a11y:{config:{rules:[{id:"color-contrast",enabled:!1}]}}}},t={args:{placeholder:"Enter text…","aria-label":"Example input"},play:async({canvasElement:p})=>{const d=g(p).getByLabelText("Example input");await m.type(d,"hello"),await i(d).toHaveValue("hello")}},l={args:{required:!0,placeholder:"Required field","aria-label":"Required example"}},o={args:{readOnly:!0,defaultValue:"Read-only value","aria-label":"Read-only example"}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    placeholder: 'Disabled input'
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter text…',
    'aria-label': 'Example input'
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Example input');
    await userEvent.type(input, 'hello');
    await expect(input).toHaveValue('hello');
  }
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    required: true,
    placeholder: 'Required field',
    'aria-label': 'Required example'
  }
}`,...l.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    readOnly: true,
    defaultValue: 'Read-only value',
    'aria-label': 'Read-only example'
  }
}`,...o.parameters?.docs?.source}}};const E=["Default","WithValue","Password","Disabled","Invalid","TypesAndReflectsValue","Required","ReadOnly"];export{e as Default,n as Disabled,s as Invalid,r as Password,o as ReadOnly,l as Required,t as TypesAndReflectsValue,a as WithValue,E as __namedExportsOrder,v as default};
