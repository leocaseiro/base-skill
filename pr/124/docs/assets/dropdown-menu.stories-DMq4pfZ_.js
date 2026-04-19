import{j as e}from"./iframe-CX61sPRB.js";import{B as d}from"./button-JrpPN-ki.js";import{D as c,a as g,b as w,c as r,d as x}from"./dropdown-menu-BX_GgMpO.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-BAlGeYR_.js";import"./index-B0x26r4p.js";import"./index-BCeU1DTI.js";import"./index-JgZY8VgY.js";import"./index-B19rgWYL.js";import"./index-DlREZ1Ji.js";import"./index-TOr4jz_C.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DjtF0Z_-.js";import"./index-DczJKmZN.js";const{expect:m,userEvent:l,waitFor:p,within:u}=__STORYBOOK_MODULE_TEST__,T={component:c,tags:["autodocs"],args:{triggerLabel:"Options",item1:"Profile",item2:"Settings",item3:"Logout"},argTypes:{triggerLabel:{control:"text"},item1:{control:"text"},item2:{control:"text"},item3:{control:"text"}},render:({triggerLabel:n,item1:o,item2:t,item3:D})=>e.jsxs(c,{children:[e.jsx(g,{asChild:!0,children:e.jsx(d,{variant:"outline",children:n})}),e.jsxs(w,{children:[e.jsx(r,{children:o}),e.jsx(r,{children:t}),e.jsx(x,{}),e.jsx(r,{children:D})]})]})},i={},a={play:async({canvasElement:n})=>{const o=u(n);await l.click(o.getByRole("button",{name:/options/i}));const t=u(document.body);await p(()=>{m(t.getByRole("menu")).toBeVisible()}),await l.click(await t.findByRole("menuitem",{name:/profile/i})),await p(()=>{m(t.queryByRole("menu")).toBeNull()})}},s={render:({triggerLabel:n,item1:o,item2:t})=>e.jsxs(c,{children:[e.jsx(g,{asChild:!0,children:e.jsx(d,{variant:"outline",children:n})}),e.jsxs(w,{children:[e.jsx(r,{children:o}),e.jsx(r,{children:t}),e.jsx(x,{}),e.jsx(r,{variant:"destructive",children:"Delete account"})]})]}),args:{triggerLabel:"Account",item1:"Profile",item2:"Settings",item3:""}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:"{}",...i.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: /options/i
    }));
    const portal = within(document.body);
    await waitFor(() => {
      expect(portal.getByRole('menu')).toBeVisible();
    });
    await userEvent.click(await portal.findByRole('menuitem', {
      name: /profile/i
    }));
    await waitFor(() => {
      expect(portal.queryByRole('menu')).toBeNull();
    });
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: ({
    triggerLabel,
    item1,
    item2
  }) => <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>{item1}</DropdownMenuItem>
        <DropdownMenuItem>{item2}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          Delete account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  args: {
    triggerLabel: 'Account',
    item1: 'Profile',
    item2: 'Settings',
    item3: ''
  }
}`,...s.parameters?.docs?.source}}};const C=["Default","OpensAndSelects","WithDestructiveItem"];export{i as Default,a as OpensAndSelects,s as WithDestructiveItem,C as __namedExportsOrder,T as default};
