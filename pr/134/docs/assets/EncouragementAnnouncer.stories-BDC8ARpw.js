import{r as l,j as r}from"./iframe-DYG-fNJf.js";import"./preload-helper-PPVm8Dsz.js";const c=({visible:e,message:s,onDismiss:n})=>(l.useEffect(()=>{if(!e)return;const t=setTimeout(n,2e3);return()=>clearTimeout(t)},[e,n]),e?r.jsxs("div",{role:"status","aria-live":"polite",className:"pointer-events-none fixed bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-background/95 px-6 py-4 shadow-xl",children:[r.jsx("span",{className:"text-5xl","aria-hidden":"true",children:"🐨"}),r.jsx("p",{className:"text-center text-lg font-semibold",children:s})]}):null);c.__docgenInfo={description:"",methods:[],displayName:"EncouragementAnnouncer",props:{visible:{required:!0,tsType:{name:"boolean"},description:""},message:{required:!0,tsType:{name:"string"},description:""},onDismiss:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const{expect:m,fn:d,userEvent:p,waitFor:g,within:x}=__STORYBOOK_MODULE_TEST__,u=({message:e,onDismiss:s})=>{const[n,t]=l.useState(!1);return r.jsxs(r.Fragment,{children:[r.jsx("button",{type:"button",onClick:()=>t(!0),disabled:n,className:"rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50",children:"Show encouragement"}),r.jsx(c,{visible:n,message:e,onDismiss:()=>{t(!1),s()}})]})},w={component:c,title:"answer-game/EncouragementAnnouncer",tags:["autodocs"],args:{message:"Keep trying!",visible:!0,onDismiss:d()},argTypes:{message:{control:"text"},visible:{control:"boolean"},onDismiss:{table:{disable:!0}}},render:({message:e,visible:s,onDismiss:n})=>r.jsx(c,{message:e,visible:s,onDismiss:n})},a={},o={args:{message:"Great job!"},render:({message:e,onDismiss:s})=>r.jsx(u,{message:e,onDismiss:s})},i={args:{message:"Keep trying!"},render:({message:e,onDismiss:s})=>r.jsx(u,{message:e,onDismiss:s}),play:async({args:e,canvasElement:s})=>{const n=x(s);await p.click(n.getByRole("button",{name:/show encouragement/i})),await g(()=>{m(n.getByText(/keep trying/i)).toBeVisible()}),await g(()=>{m(e.onDismiss).toHaveBeenCalled()},{timeout:3500})}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Great job!'
  },
  render: ({
    message,
    onDismiss
  }) => <ShowTrigger message={message} onDismiss={onDismiss} />
}`,...o.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
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
}`,...i.parameters?.docs?.source}}};const f=["Playground","ReplayTrigger","AutoDismissesAfter2s"];export{i as AutoDismissesAfter2s,a as Playground,o as ReplayTrigger,f as __namedExportsOrder,w as default};
