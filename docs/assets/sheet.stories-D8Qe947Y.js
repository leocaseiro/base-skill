import{j as e}from"./iframe-DXzTbisB.js";import{B as i}from"./button-CcGfnkEd.js";import{S as n,a as s,b as o,c as h,d as a,e as d}from"./sheet-CzY7Wk3S.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-BJbEcrTi.js";import"./createLucideIcon-CHezL-v5.js";import"./index-C6fPjA2c.js";import"./index-D5WEQ1P2.js";import"./index-CwoPFrX3.js";import"./index-50WIygnr.js";import"./index-BvGN_dAG.js";import"./index-faEReVpd.js";import"./tslib.es6--Hu8dhvm.js";import"./index-D_GE69e-.js";const O={component:n,tags:["autodocs"]},t={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open sheet"})}),e.jsxs(o,{side:"right",children:[e.jsxs(h,{children:[e.jsx(a,{children:"Sheet Title"}),e.jsx(d,{children:"Sheet description here."})]}),e.jsx("p",{className:"p-4 text-sm",children:"Sheet body content."})]})]})},r={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open left"})}),e.jsx(o,{side:"left",children:e.jsx(h,{children:e.jsx(a,{children:"Navigation"})})})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
