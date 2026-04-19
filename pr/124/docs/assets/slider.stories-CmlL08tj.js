import{S as l}from"./slider-D7F6ZHNw.js";import"./iframe-CX61sPRB.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-CMNAlJOM.js";import"./index-B0x26r4p.js";import"./index-BAlGeYR_.js";import"./index-DlREZ1Ji.js";import"./index-BCeU1DTI.js";import"./index-JgZY8VgY.js";import"./index-B19rgWYL.js";const{expect:m,userEvent:c,within:i}=__STORYBOOK_MODULE_TEST__,h={component:l,tags:["autodocs"],argTypes:{min:{control:{type:"range",min:0,max:100,step:1}},max:{control:{type:"range",min:1,max:200,step:1}},step:{control:{type:"range",min:1,max:20,step:1}},disabled:{control:"boolean"}}},a={args:{defaultValue:[50],min:0,max:100,step:1,className:"w-64"}},e={args:{defaultValue:[80],min:0,max:100,step:1,className:"w-64","aria-label":"Volume"}},r={args:{defaultValue:[10],min:5,max:20,step:1,className:"w-64","aria-label":"Speech rate"}},s={args:{defaultValue:[50],min:0,max:100,step:1,className:"w-64","aria-label":"Keyboard-driven slider"},play:async({canvasElement:o})=>{const n=i(o).getByRole("slider");n.focus(),await c.keyboard("{ArrowRight}"),await m(n).toHaveAttribute("aria-valuenow","51")}},t={args:{defaultValue:[50],min:0,max:100,step:1,className:"w-64","aria-label":"Disabled slider",disabled:!0}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    className: 'w-64',
    'aria-label': 'Disabled slider',
    disabled: true
  }
}`,...t.parameters?.docs?.source}}};const N=["Default","Volume","SpeechRate","KeyboardIncrement","Disabled"];export{a as Default,t as Disabled,s as KeyboardIncrement,r as SpeechRate,e as Volume,N as __namedExportsOrder,h as default};
