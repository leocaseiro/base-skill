import{j as t}from"./iframe-Dq9Bedm6.js";import{A as m,a as x,b as h,c as v,d as R,e as E,f,g as C,h as D}from"./alert-dialog-Ci31ICjT.js";import{B as A}from"./button-8av6upfN.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-Dso0tgHw.js";import"./index-q0wBrzQt.js";import"./index-JS0_DZTT.js";import"./index-DLo2hlnv.js";import"./index-BO08A1MB.js";import"./index-Ci6CkdnI.js";import"./index-Rqj9Sv4J.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DlsM3IAv.js";const{expect:r,fn:u,userEvent:o,waitFor:i,within:l}=__STORYBOOK_MODULE_TEST__,H={component:m,title:"UI/AlertDialog",tags:["autodocs"],args:{triggerLabel:"Delete account",title:"Are you sure?",description:"This action cannot be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",onOpenChange:u(),onConfirm:u(),onCancel:u()},argTypes:{triggerLabel:{control:"text"},title:{control:"text"},description:{control:"text"},confirmLabel:{control:"text"},cancelLabel:{control:"text"},onOpenChange:{table:{disable:!0}},onConfirm:{table:{disable:!0}},onCancel:{table:{disable:!0}}},render:({triggerLabel:a,title:n,description:e,confirmLabel:y,cancelLabel:g,onOpenChange:w,onConfirm:b,onCancel:B})=>t.jsxs(m,{onOpenChange:w,children:[t.jsx(x,{asChild:!0,children:t.jsx(A,{variant:"destructive",children:a})}),t.jsxs(h,{children:[t.jsxs(v,{children:[t.jsx(R,{children:n}),t.jsx(E,{children:e})]}),t.jsxs(f,{children:[t.jsx(C,{onClick:B,children:g}),t.jsx(D,{onClick:b,children:y})]})]})]})},c={},s={play:async({canvasElement:a})=>{const n=l(a);await o.click(n.getByRole("button",{name:/delete account/i}));const e=l(document.body);await i(()=>{r(e.getByRole("alertdialog")).toBeVisible()}),await o.click(await e.findByRole("button",{name:/^delete$/i})),await i(()=>{r(e.queryByRole("alertdialog")).toBeNull()})}},d={play:async({canvasElement:a})=>{const n=l(a);await o.click(n.getByRole("button",{name:/delete account/i}));const e=l(document.body);await i(()=>{r(e.getByRole("alertdialog")).toBeVisible()}),await o.keyboard("{Escape}"),await i(()=>{r(e.queryByRole("alertdialog")).toBeNull()})}},p={play:async({canvasElement:a})=>{const n=l(a);await o.click(n.getByRole("button",{name:/delete account/i}));const e=l(document.body);await o.click(await e.findByRole("button",{name:/cancel/i})),await i(()=>{r(e.queryByRole("alertdialog")).toBeNull()})}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:"{}",...c.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...p.parameters?.docs?.source}}};const I=["Default","OpensAndConfirms","CancelsWithEscape","Cancelled"];export{p as Cancelled,d as CancelsWithEscape,c as Default,s as OpensAndConfirms,I as __namedExportsOrder,H as default};
