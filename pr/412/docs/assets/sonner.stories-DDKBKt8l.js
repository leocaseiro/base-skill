import{j as e}from"./iframe-DQPhJkAL.js";import{T as u,t as d}from"./index-BzRjFcO2.js";import{B as m}from"./button-BNvJi1mB.js";import{c as t}from"./createLucideIcon-Cy9Exb_I.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CHlaCmOK.js";import"./index-CL1GXndm.js";import"./utils-BQHNewu7.js";import"./index-CyJRJLHs.js";const h=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],y=t("circle-check",h);const v=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],f=t("info",v);const w=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],x=t("loader-circle",w);const _=[["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z",key:"2d38gg"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],S=t("octagon-x",_);const k=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],b=t("triangle-alert",k),g=({...a})=>e.jsx(u,{theme:"light",className:"toaster group",icons:{success:e.jsx(y,{className:"size-4"}),info:e.jsx(f,{className:"size-4"}),warning:e.jsx(b,{className:"size-4"}),error:e.jsx(S,{className:"size-4"}),loading:e.jsx(x,{className:"size-4 animate-spin"})},style:{"--normal-bg":"var(--popover)","--normal-text":"var(--popover-foreground)","--normal-border":"var(--border)","--border-radius":"var(--radius)"},toastOptions:{classNames:{toast:"cn-toast"}},...a});g.__docgenInfo={description:"",methods:[],displayName:"Toaster"};const{expect:T,userEvent:j,waitFor:E,within:p}=__STORYBOOK_MODULE_TEST__,N=[a=>e.jsxs(e.Fragment,{children:[e.jsx(a,{}),e.jsx(g,{})]})],R={title:"UI/Sonner",component:m,tags:["autodocs"],decorators:N,args:{variant:"default",message:"Event registered!",triggerLabel:"Show toast"},argTypes:{variant:{control:{type:"select"},options:["default","success","error"]},message:{control:"text"},triggerLabel:{control:"text"}},render:({variant:a,message:s,triggerLabel:i})=>{const l=()=>a==="success"?d.success(s):a==="error"?d.error(s):d(s);return e.jsx(m,{onClick:l,children:i})}},r={args:{variant:"default"}},o={args:{variant:"success",message:"Saved successfully"}},n={args:{variant:"error",message:"Something went wrong"}},c={args:{variant:"default",message:"Event registered!",triggerLabel:"Show toast"},play:async({canvasElement:a})=>{const s=p(a);await j.click(s.getByRole("button",{name:/show toast/i}));const i=p(document.body);await E(async()=>{const l=await i.findByText(/event registered/i);await T(l).toBeVisible()})}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'default'
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    message: 'Saved successfully'
  }
}`,...o.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    message: 'Something went wrong'
  }
}`,...n.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'default',
    message: 'Event registered!',
    triggerLabel: 'Show toast'
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: /show toast/i
    }));
    const portal = within(document.body);
    await waitFor(async () => {
      const el = await portal.findByText(/event registered/i);
      await expect(el).toBeVisible();
    });
  }
}`,...c.parameters?.docs?.source}}};const D=["Default","Success","Error","ShowsToast"];export{r as Default,n as Error,c as ShowsToast,o as Success,D as __namedExportsOrder,R as default};
