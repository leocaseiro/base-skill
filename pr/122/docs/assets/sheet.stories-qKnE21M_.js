import{j as e}from"./iframe-C9T1G0C6.js";import{B as i}from"./button-D4wdJmx1.js";import{S as n,a as s,b as o,c as h,d as a,e as d}from"./sheet-2ImXaV_w.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-DZ_rr_Zl.js";import"./createLucideIcon-C4QZwOiK.js";import"./index-DkIe_kCN.js";import"./index-dy0lXgVg.js";import"./index-C-7MiCNk.js";import"./index-B1fL_0cc.js";import"./index-W-snya6D.js";import"./index-DgrB3PLs.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CHMFiyoJ.js";const O={component:n,tags:["autodocs"]},t={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open sheet"})}),e.jsxs(o,{side:"right",children:[e.jsxs(h,{children:[e.jsx(a,{children:"Sheet Title"}),e.jsx(d,{children:"Sheet description here."})]}),e.jsx("p",{className:"p-4 text-sm",children:"Sheet body content."})]})]})},r={render:()=>e.jsxs(n,{children:[e.jsx(s,{asChild:!0,children:e.jsx(i,{variant:"outline",children:"Open left"})}),e.jsx(o,{side:"left",children:e.jsx(h,{children:e.jsx(a,{children:"Navigation"})})})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
