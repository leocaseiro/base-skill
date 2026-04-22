import{j as e}from"./iframe-CaV79fpd.js";import{S as u,a as d,b as g,c as b,d as a}from"./select-DqWgZwZ7.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./createLucideIcon-BV_TdaFj.js";import"./index-Dj-mpeAu.js";import"./index-rnpAcTz6.js";import"./index-CJq90Mys.js";import"./index-CVUTBxXp.js";import"./index-DrcGkugx.js";import"./index-BmGjVqIm.js";import"./index-Dhvm-akf.js";import"./index-B9Gns1vs.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CikuNynw.js";const{expect:v,fn:S,userEvent:h,within:x}=__STORYBOOK_MODULE_TEST__,D={component:u,tags:["autodocs"],args:{triggerLabel:"Select a fruit",option1:"Apple",option2:"Banana",option3:"Orange",onValueChange:S(),onOpenChange:S()},argTypes:{triggerLabel:{control:"text"},option1:{control:"text"},option2:{control:"text"},option3:{control:"text"},onValueChange:{table:{disable:!0}},onOpenChange:{table:{disable:!0}}},render:({triggerLabel:t,option1:n,option2:o,option3:r,onValueChange:l,onOpenChange:c})=>e.jsxs(u,{onValueChange:l,onOpenChange:c,children:[e.jsx(d,{className:"w-48","aria-label":t,children:e.jsx(g,{placeholder:"Pick a fruit"})}),e.jsxs(b,{children:[e.jsx(a,{value:"apple",children:n}),e.jsx(a,{value:"banana",children:o}),e.jsx(a,{value:"orange",children:r})]})]})},s={},i={render:({triggerLabel:t,option1:n,option2:o,option3:r,onValueChange:l,onOpenChange:c})=>e.jsxs(u,{defaultValue:"banana",onValueChange:l,onOpenChange:c,children:[e.jsx(d,{className:"w-48","aria-label":t,children:e.jsx(g,{})}),e.jsxs(b,{children:[e.jsx(a,{value:"apple",children:n}),e.jsx(a,{value:"banana",children:o}),e.jsx(a,{value:"orange",children:r})]})]})},p={render:({triggerLabel:t,option1:n,option2:o,option3:r,onValueChange:l,onOpenChange:c})=>e.jsxs(u,{disabled:!0,onValueChange:l,onOpenChange:c,children:[e.jsx(d,{className:"w-48","aria-label":t,children:e.jsx(g,{placeholder:"Pick a fruit"})}),e.jsxs(b,{children:[e.jsx(a,{value:"apple",children:n}),e.jsx(a,{value:"banana",children:o}),e.jsx(a,{value:"orange",children:r})]})]})},m={play:async({canvasElement:t})=>{const n=x(t);await h.click(n.getByRole("combobox",{name:/select a fruit/i}));const o=x(document.body);await h.click(o.getByRole("option",{name:/banana/i})),await v(n.getByRole("combobox")).toHaveTextContent(/banana/i)}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{}",...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: ({
    triggerLabel,
    option1,
    option2,
    option3,
    onValueChange,
    onOpenChange
  }) => <Select defaultValue="banana" onValueChange={onValueChange} onOpenChange={onOpenChange}>
      <SelectTrigger className="w-48" aria-label={triggerLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">{option1}</SelectItem>
        <SelectItem value="banana">{option2}</SelectItem>
        <SelectItem value="orange">{option3}</SelectItem>
      </SelectContent>
    </Select>
}`,...i.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: ({
    triggerLabel,
    option1,
    option2,
    option3,
    onValueChange,
    onOpenChange
  }) => <Select disabled onValueChange={onValueChange} onOpenChange={onOpenChange}>
      <SelectTrigger className="w-48" aria-label={triggerLabel}>
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">{option1}</SelectItem>
        <SelectItem value="banana">{option2}</SelectItem>
        <SelectItem value="orange">{option3}</SelectItem>
      </SelectContent>
    </Select>
}`,...p.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', {
      name: /select a fruit/i
    }));
    const portal = within(document.body);
    await userEvent.click(portal.getByRole('option', {
      name: /banana/i
    }));
    await expect(canvas.getByRole('combobox')).toHaveTextContent(/banana/i);
  }
}`,...m.parameters?.docs?.source}}};const N=["Default","Preselected","Disabled","SelectsOption"];export{s as Default,p as Disabled,i as Preselected,m as SelectsOption,N as __namedExportsOrder,D as default};
