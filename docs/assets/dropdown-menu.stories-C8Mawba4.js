import{j as e}from"./iframe-dd_LaRMw.js";import{B as x}from"./button-D_EdpMBu.js";import{D as p,a as D,b as S,c as n,d as M}from"./dropdown-menu-11hUYC6T.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-1SInbsf1.js";import"./index-bcCzfeAf.js";import"./index-4kuoNy8C.js";import"./index-CKIkzmmH.js";import"./index-Bh4GF9Du.js";import"./index-DTcUFiMH.js";import"./index-_zWWpNc9.js";import"./tslib.es6--Hu8dhvm.js";import"./index-sBRvRpP_.js";import"./index-D1To77Ye.js";const{expect:u,fn:d,userEvent:g,waitFor:w,within:h}=__STORYBOOK_MODULE_TEST__,A={component:p,title:"UI/DropdownMenu",tags:["autodocs"],args:{triggerLabel:"Options",item1:"Profile",item2:"Settings",item3:"Logout",onOpenChange:d(),onItemSelect:d()},argTypes:{triggerLabel:{control:"text"},item1:{control:"text"},item2:{control:"text"},item3:{control:"text"},onOpenChange:{table:{disable:!0}},onItemSelect:{table:{disable:!0}}},render:({triggerLabel:o,item1:r,item2:t,item3:l,onOpenChange:a,onItemSelect:m})=>e.jsxs(p,{onOpenChange:a,children:[e.jsx(D,{asChild:!0,children:e.jsx(x,{variant:"outline",children:o})}),e.jsxs(S,{children:[e.jsx(n,{onSelect:m,children:r}),e.jsx(n,{onSelect:m,children:t}),e.jsx(M,{}),e.jsx(n,{onSelect:m,children:l})]})]})},i={},s={play:async({canvasElement:o})=>{const r=h(o);await g.click(r.getByRole("button",{name:/options/i}));const t=h(document.body);await w(()=>{u(t.getByRole("menu")).toBeVisible()}),await g.click(await t.findByRole("menuitem",{name:/profile/i})),await w(()=>{u(t.queryByRole("menu")).toBeNull()})}},c={render:({triggerLabel:o,item1:r,item2:t,onOpenChange:l,onItemSelect:a})=>e.jsxs(p,{onOpenChange:l,children:[e.jsx(D,{asChild:!0,children:e.jsx(x,{variant:"outline",children:o})}),e.jsxs(S,{children:[e.jsx(n,{onSelect:a,children:r}),e.jsx(n,{onSelect:a,children:t}),e.jsx(M,{}),e.jsx(n,{variant:"destructive",onSelect:a,children:"Delete account"})]})]}),args:{triggerLabel:"Account",item1:"Profile",item2:"Settings",item3:""}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:"{}",...i.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: ({
    triggerLabel,
    item1,
    item2,
    onOpenChange,
    onItemSelect
  }) => <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onItemSelect}>
          {item1}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onItemSelect}>
          {item2}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onItemSelect}>
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
}`,...c.parameters?.docs?.source}}};const F=["Default","OpensAndSelects","WithDestructiveItem"];export{i as Default,s as OpensAndSelects,c as WithDestructiveItem,F as __namedExportsOrder,A as default};
