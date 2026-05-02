import{j as e}from"./iframe-BPYcqbmT.js";import{B as b}from"./button-DIL9hZGV.js";import{S as m,a as S,b as B,c as w,d as E,e as f}from"./sheet-CdWhfuBS.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-Bjg385sZ.js";import"./createLucideIcon--U8hD63B.js";import"./index-Ce7pBD3U.js";import"./index-C-2B5JWc.js";import"./index-Cs39n4q-.js";import"./index-BaawEmpL.js";import"./index-ee0GOhvy.js";import"./index-HADyHMf2.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DGb1qjZ4.js";const{expect:l,fn:O,userEvent:d,waitFor:g,within:u}=__STORYBOOK_MODULE_TEST__,H={component:m,title:"UI/Sheet",tags:["autodocs"],args:{side:"right",triggerLabel:"Open sheet",title:"Sheet Title",description:"Sheet description here.",body:"Sheet body content.",onOpenChange:O()},argTypes:{side:{control:{type:"select"},options:["right","left","top","bottom"]},triggerLabel:{control:"text"},title:{control:"text"},description:{control:"text"},body:{control:"text"},onOpenChange:{table:{disable:!0}}},render:({side:c,triggerLabel:p,title:t,description:h,body:y,onOpenChange:x})=>e.jsxs(m,{onOpenChange:x,children:[e.jsx(S,{asChild:!0,children:e.jsx(b,{variant:"outline",children:p})}),e.jsxs(B,{side:c,children:[e.jsxs(w,{children:[e.jsx(E,{children:t}),e.jsx(f,{children:h})]}),e.jsx("p",{className:"p-4 text-sm",children:y})]})]})},o={},r={args:{side:"right"}},s={args:{side:"left"}},a={args:{side:"top"}},n={args:{side:"bottom"}},i={play:async({canvasElement:c})=>{const p=u(c);await d.click(p.getByRole("button",{name:/open sheet/i}));const t=u(document.body);await g(()=>{l(t.getByRole("dialog")).toBeVisible()}),await d.keyboard("{Escape}"),await g(()=>{l(t.queryByRole("dialog")).toBeNull()})}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:"{}",...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    side: 'right'
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...i.parameters?.docs?.source}}};const I=["Default","FromRight","FromLeft","FromTop","FromBottom","OpensAndClosesOnEscape"];export{o as Default,n as FromBottom,s as FromLeft,r as FromRight,a as FromTop,i as OpensAndClosesOnEscape,I as __namedExportsOrder,H as default};
