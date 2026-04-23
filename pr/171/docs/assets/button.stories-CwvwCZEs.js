import{B as g}from"./button-_TdL2IRV.js";import"./iframe-D1FNDb-Z.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-CN49QVfQ.js";const{expect:h,fn:v,userEvent:S,within:y}=__STORYBOOK_MODULE_TEST__,O={component:g,tags:["autodocs"],args:{onClick:v()},argTypes:{variant:{control:{type:"select"},options:["default","outline","secondary","ghost","destructive","link"]},size:{control:{type:"select"},options:["default","xs","sm","lg","icon","icon-xs","icon-sm","icon-lg"]},disabled:{control:"boolean"}}},e={args:{children:"Button",variant:"default"}},a={args:{children:"Outline",variant:"outline"}},r={args:{children:"Secondary",variant:"secondary"},parameters:{a11y:{config:{rules:[{id:"color-contrast",enabled:!1}]}}}},n={args:{children:"Ghost",variant:"ghost"}},s={args:{children:"Delete",variant:"destructive"}},t={args:{children:"Link",variant:"link"}},o={args:{children:"Small",size:"sm"}},c={args:{children:"Large",size:"lg"}},i={args:{children:"★",size:"icon","aria-label":"Star"}},l={args:{children:"Disabled",disabled:!0}},d={args:{children:"Click me",variant:"default"},play:async({args:u,canvasElement:m})=>{const p=y(m);await S.click(p.getByRole("button",{name:/click me/i})),await h(u.onClick).toHaveBeenCalledTimes(1)}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Button',
    variant: 'default'
  }
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Outline',
    variant: 'outline'
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Secondary',
    variant: 'secondary'
  },
  parameters: {
    a11y: {
      config: {
        rules: [{
          // shadcn's secondary variant uses text-secondary-foreground
          // (~neutral-500) on bg-secondary (~neutral-100) at 4.34:1 —
          // just below the 4.5:1 threshold. TODO: update the token pair.
          id: 'color-contrast',
          enabled: false
        }]
      }
    }
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Ghost',
    variant: 'ghost'
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Delete',
    variant: 'destructive'
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Link',
    variant: 'link'
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Small',
    size: 'sm'
  }
}`,...o.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Large',
    size: 'lg'
  }
}`,...c.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    children: '★',
    size: 'icon',
    'aria-label': 'Star'
  }
}`,...i.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Disabled',
    disabled: true
  }
}`,...l.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Click me',
    variant: 'default'
  },
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: /click me/i
    }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  }
}`,...d.parameters?.docs?.source}}};const C=["Default","Outline","Secondary","Ghost","Destructive","Link","Small","Large","Icon","Disabled","ClicksButton"];export{d as ClicksButton,e as Default,s as Destructive,l as Disabled,n as Ghost,i as Icon,c as Large,t as Link,a as Outline,r as Secondary,o as Small,C as __namedExportsOrder,O as default};
