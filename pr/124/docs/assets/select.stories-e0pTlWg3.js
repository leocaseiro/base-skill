import{j as e}from"./iframe-CX61sPRB.js";import{S as p,a as m,b as d,c as u,d as a}from"./select-CdVBSqpB.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./createLucideIcon-CeB-8otp.js";import"./index-JgZY8VgY.js";import"./index-B19rgWYL.js";import"./index-CMNAlJOM.js";import"./index-B0x26r4p.js";import"./index-DlREZ1Ji.js";import"./index-BAlGeYR_.js";import"./index-TOr4jz_C.js";import"./index-BCeU1DTI.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DjtF0Z_-.js";const{expect:b,userEvent:g,within:S}=__STORYBOOK_MODULE_TEST__,C={component:p,tags:["autodocs"],args:{triggerLabel:"Select a fruit",option1:"Apple",option2:"Banana",option3:"Orange"},argTypes:{triggerLabel:{control:"text"},option1:{control:"text"},option2:{control:"text"},option3:{control:"text"}},render:({triggerLabel:n,option1:t,option2:o,option3:r})=>e.jsxs(p,{children:[e.jsx(m,{className:"w-48","aria-label":n,children:e.jsx(d,{placeholder:"Pick a fruit"})}),e.jsxs(u,{children:[e.jsx(a,{value:"apple",children:t}),e.jsx(a,{value:"banana",children:o}),e.jsx(a,{value:"orange",children:r})]})]})},l={},c={render:({triggerLabel:n,option1:t,option2:o,option3:r})=>e.jsxs(p,{defaultValue:"banana",children:[e.jsx(m,{className:"w-48","aria-label":n,children:e.jsx(d,{})}),e.jsxs(u,{children:[e.jsx(a,{value:"apple",children:t}),e.jsx(a,{value:"banana",children:o}),e.jsx(a,{value:"orange",children:r})]})]})},s={render:({triggerLabel:n,option1:t,option2:o,option3:r})=>e.jsxs(p,{disabled:!0,children:[e.jsx(m,{className:"w-48","aria-label":n,children:e.jsx(d,{placeholder:"Pick a fruit"})}),e.jsxs(u,{children:[e.jsx(a,{value:"apple",children:t}),e.jsx(a,{value:"banana",children:o}),e.jsx(a,{value:"orange",children:r})]})]})},i={play:async({canvasElement:n})=>{const t=S(n);await g.click(t.getByRole("combobox",{name:/select a fruit/i}));const o=S(document.body);await g.click(o.getByRole("option",{name:/banana/i})),await b(t.getByRole("combobox")).toHaveTextContent(/banana/i)}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:"{}",...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: ({
    triggerLabel,
    option1,
    option2,
    option3
  }) => <Select defaultValue="banana">
      <SelectTrigger className="w-48" aria-label={triggerLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">{option1}</SelectItem>
        <SelectItem value="banana">{option2}</SelectItem>
        <SelectItem value="orange">{option3}</SelectItem>
      </SelectContent>
    </Select>
}`,...c.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: ({
    triggerLabel,
    option1,
    option2,
    option3
  }) => <Select disabled>
      <SelectTrigger className="w-48" aria-label={triggerLabel}>
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">{option1}</SelectItem>
        <SelectItem value="banana">{option2}</SelectItem>
        <SelectItem value="orange">{option3}</SelectItem>
      </SelectContent>
    </Select>
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
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
}`,...i.parameters?.docs?.source}}};const L=["Default","Preselected","Disabled","SelectsOption"];export{l as Default,s as Disabled,c as Preselected,i as SelectsOption,L as __namedExportsOrder,C as default};
