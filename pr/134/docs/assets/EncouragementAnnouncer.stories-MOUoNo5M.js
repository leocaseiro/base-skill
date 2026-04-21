import{r as u,j as r}from"./iframe-Dfo1a1-D.js";import"./preload-helper-PPVm8Dsz.js";const m=({visible:e,message:s,onDismiss:n})=>(u.useEffect(()=>{if(!e)return;const a=setTimeout(n,2e3);return()=>clearTimeout(a)},[e,n]),e?r.jsxs("div",{role:"status","aria-live":"polite",className:"pointer-events-none fixed bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-background/95 px-6 py-4 shadow-xl",children:[r.jsx("span",{className:"text-5xl","aria-hidden":"true",children:"🐨"}),r.jsx("p",{className:"text-center text-lg font-semibold",children:s})]}):null);m.__docgenInfo={description:"",methods:[],displayName:"EncouragementAnnouncer",props:{visible:{required:!0,tsType:{name:"boolean"},description:""},message:{required:!0,tsType:{name:"string"},description:""},onDismiss:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const{expect:g,fn:d,userEvent:x,waitFor:l,within:y}=__STORYBOOK_MODULE_TEST__,p=({message:e,onDismiss:s})=>{const[n,a]=u.useState(!1);return r.jsxs(r.Fragment,{children:[r.jsx("button",{type:"button",onClick:()=>a(!0),disabled:n,className:"rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50",children:"Show encouragement"}),r.jsx(m,{visible:n,message:e,onDismiss:()=>{a(!1),s()}})]})},v={component:m,title:"answer-game/EncouragementAnnouncer",tags:["autodocs"],args:{message:"Keep trying!",visible:!1,onDismiss:d()},argTypes:{message:{control:"text"},visible:{control:"boolean"},onDismiss:{table:{disable:!0}}},render:({message:e,visible:s,onDismiss:n})=>r.jsx(m,{message:e,visible:s,onDismiss:n})},t={args:{visible:!1,message:"Keep trying!"}},i={args:{visible:!0,message:"Almost! Try again."}},o={args:{message:"Great job!"},render:({message:e,onDismiss:s})=>r.jsx(p,{message:e,onDismiss:s})},c={args:{message:"Keep trying!"},render:({message:e,onDismiss:s})=>r.jsx(p,{message:e,onDismiss:s}),play:async({args:e,canvasElement:s})=>{const n=y(s);await x.click(n.getByRole("button",{name:/show encouragement/i})),await l(()=>{g(n.getByText(/keep trying/i)).toBeVisible()}),await l(()=>{g(e.onDismiss).toHaveBeenCalled()},{timeout:3500})}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    visible: false,
    message: 'Keep trying!'
  }
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    visible: true,
    message: 'Almost! Try again.'
  }
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Great job!'
  },
  render: ({
    message,
    onDismiss
  }) => <ShowTrigger message={message} onDismiss={onDismiss} />
}`,...o.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Keep trying!'
  },
  render: ({
    message,
    onDismiss
  }) => <ShowTrigger message={message} onDismiss={onDismiss} />,
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {
      name: /show encouragement/i
    }));
    await waitFor(() => {
      expect(canvas.getByText(/keep trying/i)).toBeVisible();
    });
    await waitFor(() => {
      expect(args.onDismiss).toHaveBeenCalled();
    }, {
      timeout: 3500
    });
  }
}`,...c.parameters?.docs?.source}}};const w=["Hidden","Visible","ReplayTrigger","AutoDismissesAfter2s"];export{c as AutoDismissesAfter2s,t as Hidden,o as ReplayTrigger,i as Visible,w as __namedExportsOrder,v as default};
