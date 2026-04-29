import{S as m}from"./slider-CRnVVr8a.js";import"./iframe-Dm_jfhuw.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-Cu15DRI0.js";import"./index-D1EyS1wE.js";import"./index-DR8R6gEj.js";import"./index-D0Nkv95q.js";import"./index-kt7Ny38n.js";import"./index-Bu8_yCPE.js";import"./index-BKCQnOC4.js";const{expect:c,fn:o,userEvent:i,within:p}=__STORYBOOK_MODULE_TEST__,N={component:m,tags:["autodocs"],args:{onValueChange:o(),onValueCommit:o()},argTypes:{min:{control:{type:"range",min:0,max:100,step:1}},max:{control:{type:"range",min:1,max:200,step:1}},step:{control:{type:"range",min:1,max:20,step:1}},disabled:{control:"boolean"}}},a={args:{defaultValue:[50],min:0,max:100,step:1,className:"w-64"}},e={args:{defaultValue:[80],min:0,max:100,step:1,className:"w-64","aria-label":"Volume"}},r={args:{defaultValue:[10],min:5,max:20,step:1,className:"w-64","aria-label":"Speech rate"}},s={args:{defaultValue:[50],min:0,max:100,step:1,className:"w-64","aria-label":"Keyboard-driven slider"},play:async({canvasElement:l})=>{const t=p(l).getByRole("slider");t.focus(),await i.keyboard("{ArrowRight}"),await c(t).toHaveAttribute("aria-valuenow","51")}},n={args:{defaultValue:[50],min:0,max:100,step:1,className:"w-64","aria-label":"Disabled slider",disabled:!0}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64'
  }
}`,...a.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: [80],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Volume'
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: [10],
    min: 5,
    max: 20,
    step: 1,
    className: 'w-64',
    'aria-label': 'Speech rate'
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Keyboard-driven slider'
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(thumb).toHaveAttribute('aria-valuenow', '51');
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Disabled slider',
    disabled: true
  }
}`,...n.parameters?.docs?.source}}};const _=["Default","Volume","SpeechRate","KeyboardIncrement","Disabled"];export{a as Default,n as Disabled,s as KeyboardIncrement,r as SpeechRate,e as Volume,_ as __namedExportsOrder,N as default};
