import{j as e}from"./iframe-BXyiuHFg.js";import{B as i}from"./button-CgDVJSD2.js";import{S as n,a as s,b as o,c as h,d as a,e as d}from"./sheet-DV92pA7Y.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-vkR9TxUa.js";import"./createLucideIcon-CcOE1Qly.js";import"./index-EVYWSh1l.js";import"./index-BUwiZoXy.js";import"./index-CU-ycHNr.js";import"./index-5jvWsh8j.js";import"./index-C0F1g7K1.js";import"./index-CdPUeziU.js";import"./tslib.es6--Hu8dhvm.js";import"./index-3VG3YTJa.js";const O={component:n,tags:["autodocs"]},t={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open sheet"})}),e.jsxs(o,{side:"right",children:[e.jsxs(h,{children:[e.jsx(a,{children:"Sheet Title"}),e.jsx(d,{children:"Sheet description here."})]}),e.jsx("p",{className:"p-4 text-sm",children:"Sheet body content."})]})]})},r={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open left"})}),e.jsx(o,{side:"left",children:e.jsx(h,{children:e.jsx(a,{children:"Navigation"})})})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
