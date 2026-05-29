import{j as e,B as b}from"./iframe-DJm7UBnT.js";import{S as p,a as S,b as B,c as w,d as E,e as O}from"./sheet-YOJFA8-4.js";import"./preload-helper-PPVm8Dsz.js";import"./createLucideIcon-iVDoaMjK.js";const{expect:d,fn:f,userEvent:m,waitFor:g,within:u}=__STORYBOOK_MODULE_TEST__,T={component:p,title:"UI/Sheet",tags:["autodocs"],args:{side:"right",triggerLabel:"Open sheet",title:"Sheet Title",description:"Sheet description here.",body:"Sheet body content.",onOpenChange:f()},argTypes:{side:{control:{type:"select"},options:["right","left","top","bottom"]},triggerLabel:{control:"text"},title:{control:"text"},description:{control:"text"},body:{control:"text"},onOpenChange:{table:{disable:!0}}},render:({side:i,triggerLabel:l,title:t,description:h,body:y,onOpenChange:x})=>e.jsxs(p,{onOpenChange:x,children:[e.jsx(S,{asChild:!0,children:e.jsx(b,{variant:"outline",children:l})}),e.jsxs(B,{side:i,children:[e.jsxs(w,{children:[e.jsx(E,{children:t}),e.jsx(O,{children:h})]}),e.jsx("p",{className:"p-4 text-sm",children:y})]})]})},o={},r={args:{side:"right"}},s={args:{side:"left"}},a={args:{side:"top"}},n={args:{side:"bottom"}},c={play:async({canvasElement:i})=>{const l=u(i);await m.click(l.getByRole("button",{name:/open sheet/i}));const t=u(document.body);await g(()=>{d(t.getByRole("dialog")).toBeVisible()}),await m.keyboard("{Escape}"),await g(()=>{d(t.queryByRole("dialog")).toBeNull()})}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:"{}",...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
}`,...n.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source}}};const _=["Default","FromRight","FromLeft","FromTop","FromBottom","OpensAndClosesOnEscape"];export{o as Default,n as FromBottom,s as FromLeft,r as FromRight,a as FromTop,c as OpensAndClosesOnEscape,_ as __namedExportsOrder,T as default};
