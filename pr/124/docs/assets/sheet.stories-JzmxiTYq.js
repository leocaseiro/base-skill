import{j as e}from"./iframe-CX61sPRB.js";import{B as x}from"./button-JrpPN-ki.js";import{S as m,a as S,b,c as B,d as w,e as E}from"./sheet-CS0VqOcB.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-BAlGeYR_.js";import"./createLucideIcon-CeB-8otp.js";import"./index-BC0Le6tR.js";import"./index-B0x26r4p.js";import"./index-TOr4jz_C.js";import"./index-BCeU1DTI.js";import"./index-JgZY8VgY.js";import"./index-B19rgWYL.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DczJKmZN.js";const{expect:l,userEvent:d,waitFor:g,within:u}=__STORYBOOK_MODULE_TEST__,V={component:m,tags:["autodocs"],args:{side:"right",triggerLabel:"Open sheet",title:"Sheet Title",description:"Sheet description here.",body:"Sheet body content."},argTypes:{side:{control:{type:"select"},options:["right","left","top","bottom"]},triggerLabel:{control:"text"},title:{control:"text"},description:{control:"text"},body:{control:"text"}},render:({side:c,triggerLabel:p,title:t,description:h,body:y})=>e.jsxs(m,{children:[e.jsx(S,{asChild:!0,children:e.jsx(x,{variant:"outline",children:p})}),e.jsxs(b,{side:c,children:[e.jsxs(B,{children:[e.jsx(w,{children:t}),e.jsx(E,{children:h})]}),e.jsx("p",{className:"p-4 text-sm",children:y})]})]})},r={},o={args:{side:"right"}},s={args:{side:"left"}},a={args:{side:"top"}},n={args:{side:"bottom"}},i={play:async({canvasElement:c})=>{const p=u(c);await d.click(p.getByRole("button",{name:/open sheet/i}));const t=u(document.body);await g(()=>{l(t.getByRole("dialog")).toBeVisible()}),await d.keyboard("{Escape}"),await g(()=>{l(t.queryByRole("dialog")).toBeNull()})}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    side: 'right'
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    side: 'left'
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    side: 'top'
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    side: 'bottom'
  }
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: /open sheet/i
    }));
    const portal = within(document.body);
    await waitFor(() => {
      expect(portal.getByRole('dialog')).toBeVisible();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(portal.queryByRole('dialog')).toBeNull();
    });
  }
}`,...i.parameters?.docs?.source}}};const H=["Default","FromRight","FromLeft","FromTop","FromBottom","OpensAndClosesOnEscape"];export{r as Default,n as FromBottom,s as FromLeft,o as FromRight,a as FromTop,i as OpensAndClosesOnEscape,H as __namedExportsOrder,V as default};
