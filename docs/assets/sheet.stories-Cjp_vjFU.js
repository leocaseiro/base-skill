import{j as e}from"./iframe-BAoqjOVQ.js";import{B as i}from"./button-BXTwVC3Q.js";import{S as n,a as s,b as o,c as h,d as a,e as d}from"./sheet-De6QtYwj.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-Brozxcj3.js";import"./createLucideIcon-BYis_ZUO.js";import"./index-DR5DYkF7.js";import"./index-G-5KQhhv.js";import"./index-D8JxY4j-.js";import"./index-D0D15Jkg.js";import"./index-D303dXLQ.js";import"./index-B6nj1tVQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DUur095F.js";const O={component:n,tags:["autodocs"]},t={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open sheet"})}),e.jsxs(o,{side:"right",children:[e.jsxs(h,{children:[e.jsx(a,{children:"Sheet Title"}),e.jsx(d,{children:"Sheet description here."})]}),e.jsx("p",{className:"p-4 text-sm",children:"Sheet body content."})]})]})},r={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open left"})}),e.jsx(o,{side:"left",children:e.jsx(h,{children:e.jsx(a,{children:"Navigation"})})})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
