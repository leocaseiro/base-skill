import{j as t}from"./iframe-CX61sPRB.js";import{A as u,a as g,b as w,c as B,d as b,e as x,f as v,g as h,h as R}from"./alert-dialog-DmIpipEU.js";import{B as E}from"./button-JrpPN-ki.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-B0x26r4p.js";import"./index-BAlGeYR_.js";import"./index-BC0Le6tR.js";import"./index-TOr4jz_C.js";import"./index-BCeU1DTI.js";import"./index-JgZY8VgY.js";import"./index-B19rgWYL.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DczJKmZN.js";const{expect:r,userEvent:o,waitFor:c,within:l}=__STORYBOOK_MODULE_TEST__,V={component:u,tags:["autodocs"],args:{triggerLabel:"Delete account",title:"Are you sure?",description:"This action cannot be undone.",confirmLabel:"Delete",cancelLabel:"Cancel"},argTypes:{triggerLabel:{control:"text"},title:{control:"text"},description:{control:"text"},confirmLabel:{control:"text"},cancelLabel:{control:"text"}},render:({triggerLabel:a,title:n,description:e,confirmLabel:m,cancelLabel:y})=>t.jsxs(u,{children:[t.jsx(g,{asChild:!0,children:t.jsx(E,{variant:"destructive",children:a})}),t.jsxs(w,{children:[t.jsxs(B,{children:[t.jsx(b,{children:n}),t.jsx(x,{children:e})]}),t.jsxs(v,{children:[t.jsx(h,{children:y}),t.jsx(R,{children:m})]})]})]})},i={},s={play:async({canvasElement:a})=>{const n=l(a);await o.click(n.getByRole("button",{name:/delete account/i}));const e=l(document.body);await c(()=>{r(e.getByRole("alertdialog")).toBeVisible()}),await o.click(await e.findByRole("button",{name:/^delete$/i})),await c(()=>{r(e.queryByRole("alertdialog")).toBeNull()})}},d={play:async({canvasElement:a})=>{const n=l(a);await o.click(n.getByRole("button",{name:/delete account/i}));const e=l(document.body);await c(()=>{r(e.getByRole("alertdialog")).toBeVisible()}),await o.keyboard("{Escape}"),await c(()=>{r(e.queryByRole("alertdialog")).toBeNull()})}},p={play:async({canvasElement:a})=>{const n=l(a);await o.click(n.getByRole("button",{name:/delete account/i}));const e=l(document.body);await o.click(await e.findByRole("button",{name:/cancel/i})),await c(()=>{r(e.queryByRole("alertdialog")).toBeNull()})}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:"{}",...i.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: /delete account/i
    }));
    const portal = within(document.body);
    await waitFor(() => {
      expect(portal.getByRole('alertdialog')).toBeVisible();
    });
    await userEvent.click(await portal.findByRole('button', {
      name: /^delete$/i
    }));
    await waitFor(() => {
      expect(portal.queryByRole('alertdialog')).toBeNull();
    });
  }
}`,...s.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: /delete account/i
    }));
    const portal = within(document.body);
    await waitFor(() => {
      expect(portal.getByRole('alertdialog')).toBeVisible();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(portal.queryByRole('alertdialog')).toBeNull();
    });
  }
}`,...d.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: /delete account/i
    }));
    const portal = within(document.body);
    await userEvent.click(await portal.findByRole('button', {
      name: /cancel/i
    }));
    await waitFor(() => {
      expect(portal.queryByRole('alertdialog')).toBeNull();
    });
  }
}`,...p.parameters?.docs?.source}}};const W=["Default","OpensAndConfirms","CancelsWithEscape","Cancelled"];export{p as Cancelled,d as CancelsWithEscape,i as Default,s as OpensAndConfirms,W as __namedExportsOrder,V as default};
