import{j as e}from"./iframe-CIbd0DRj.js";import{B as i}from"./button-CdDrhj0m.js";import{S as n,a as s,b as o,c as h,d as a,e as d}from"./sheet-BV67Xs_B.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-CE2WdNI-.js";import"./createLucideIcon-C6pLZlit.js";import"./index-_lJLDQKQ.js";import"./index-pGQVG-WC.js";import"./index-CsVRA0i-.js";import"./index-BsuaxLL0.js";import"./index-DTWCw_1t.js";import"./index-C1wxFtZb.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CTA4lIXm.js";const O={component:n,tags:["autodocs"]},t={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open sheet"})}),e.jsxs(o,{side:"right",children:[e.jsxs(h,{children:[e.jsx(a,{children:"Sheet Title"}),e.jsx(d,{children:"Sheet description here."})]}),e.jsx("p",{className:"p-4 text-sm",children:"Sheet body content."})]})]})},r={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open left"})}),e.jsx(o,{side:"left",children:e.jsx(h,{children:e.jsx(a,{children:"Navigation"})})})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>Sheet description here.</SheetDescription>
        </SheetHeader>
        <p className="p-4 text-sm">Sheet body content.</p>
      </SheetContent>
    </Sheet>
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
}`,...r.parameters?.docs?.source}}};const F=["FromRight","FromLeft"];export{r as FromLeft,t as FromRight,F as __namedExportsOrder,O as default};
