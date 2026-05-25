import{A as m,j as a,a as x,B as h,b as v,d as R,e as E,f as C,g as f,h as D,i as A}from"./iframe-mRk4Vqn9.js";import"./preload-helper-PPVm8Dsz.js";const{expect:c,fn:p,userEvent:o,waitFor:r,within:l}=__STORYBOOK_MODULE_TEST__,O={component:m,title:"UI/AlertDialog",tags:["autodocs"],args:{triggerLabel:"Delete account",title:"Are you sure?",description:"This action cannot be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",onOpenChange:p(),onConfirm:p(),onCancel:p()},argTypes:{triggerLabel:{control:"text"},title:{control:"text"},description:{control:"text"},confirmLabel:{control:"text"},cancelLabel:{control:"text"},onOpenChange:{table:{disable:!0}},onConfirm:{table:{disable:!0}},onCancel:{table:{disable:!0}}},render:({triggerLabel:t,title:n,description:e,confirmLabel:y,cancelLabel:g,onOpenChange:w,onConfirm:b,onCancel:B})=>a.jsxs(m,{onOpenChange:w,children:[a.jsx(x,{asChild:!0,children:a.jsx(h,{variant:"destructive",children:t})}),a.jsxs(v,{children:[a.jsxs(R,{children:[a.jsx(E,{children:n}),a.jsx(C,{children:e})]}),a.jsxs(f,{children:[a.jsx(D,{onClick:B,children:g}),a.jsx(A,{onClick:b,children:y})]})]})]})},i={},s={play:async({canvasElement:t})=>{const n=l(t);await o.click(n.getByRole("button",{name:/delete account/i}));const e=l(document.body);await r(()=>{c(e.getByRole("alertdialog")).toBeVisible()}),await o.click(await e.findByRole("button",{name:/^delete$/i})),await r(()=>{c(e.queryByRole("alertdialog")).toBeNull()})}},d={play:async({canvasElement:t})=>{const n=l(t);await o.click(n.getByRole("button",{name:/delete account/i}));const e=l(document.body);await r(()=>{c(e.getByRole("alertdialog")).toBeVisible()}),await o.keyboard("{Escape}"),await r(()=>{c(e.queryByRole("alertdialog")).toBeNull()})}},u={play:async({canvasElement:t})=>{const n=l(t);await o.click(n.getByRole("button",{name:/delete account/i}));const e=l(document.body);await o.click(await e.findByRole("button",{name:/cancel/i})),await r(()=>{c(e.queryByRole("alertdialog")).toBeNull()})}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:"{}",...i.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...d.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
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
}`,...u.parameters?.docs?.source}}};const _=["Default","OpensAndConfirms","CancelsWithEscape","Cancelled"];export{u as Cancelled,d as CancelsWithEscape,i as Default,s as OpensAndConfirms,_ as __namedExportsOrder,O as default};
