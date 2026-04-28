import{z as g,j as e,J as h}from"./iframe-BaCW4T4r.js";import{T as y,t as d}from"./index-Dmu-Zmof.js";import{B as m}from"./button-DKBPmF3o.js";import{c as t}from"./createLucideIcon-Dlh4Sc6a.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BcGWUZna.js";import"./index-CPeqSbs7.js";import"./utils-BQHNewu7.js";import"./index-D_0_hMc6.js";const v=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],f=t("circle-check",v);const w=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],x=t("info",w);const _=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],S=t("loader-circle",_);const b=[["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z",key:"2d38gg"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],k=t("octagon-x",b);const T=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],j=t("triangle-alert",T),u=({...a})=>{const{theme:s="system"}=g();return e.jsx(y,{theme:s,className:"toaster group",icons:{success:e.jsx(f,{className:"size-4"}),info:e.jsx(x,{className:"size-4"}),warning:e.jsx(j,{className:"size-4"}),error:e.jsx(k,{className:"size-4"}),loading:e.jsx(S,{className:"size-4 animate-spin"})},style:{"--normal-bg":"var(--popover)","--normal-text":"var(--popover-foreground)","--normal-border":"var(--border)","--border-radius":"var(--radius)"},toastOptions:{classNames:{toast:"cn-toast"}},...a})};u.__docgenInfo={description:"",methods:[],displayName:"Toaster"};const{expect:E,userEvent:N,waitFor:z,within:p}=__STORYBOOK_MODULE_TEST__,B=[a=>e.jsxs(h,{attribute:"class",defaultTheme:"light",enableSystem:!1,children:[e.jsx(a,{}),e.jsx(u,{})]})],U={title:"UI/Sonner",component:m,tags:["autodocs"],decorators:B,args:{variant:"default",message:"Event registered!",triggerLabel:"Show toast"},argTypes:{variant:{control:{type:"select"},options:["default","success","error"]},message:{control:"text"},triggerLabel:{control:"text"}},render:({variant:a,message:s,triggerLabel:i})=>{const l=()=>a==="success"?d.success(s):a==="error"?d.error(s):d(s);return e.jsx(m,{onClick:l,children:i})}},r={args:{variant:"default"}},o={args:{variant:"success",message:"Saved successfully"}},n={args:{variant:"error",message:"Something went wrong"}},c={args:{variant:"default",message:"Event registered!",triggerLabel:"Show toast"},play:async({canvasElement:a})=>{const s=p(a);await N.click(s.getByRole("button",{name:/show toast/i}));const i=p(document.body);await z(async()=>{const l=await i.findByText(/event registered/i);await E(l).toBeVisible()})}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source}}};const V=["Default","Success","Error","ShowsToast"];export{r as Default,n as Error,c as ShowsToast,o as Success,V as __namedExportsOrder,U as default};
