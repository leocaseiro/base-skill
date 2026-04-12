import{r as c,j as t}from"./iframe-C5dZy_ON.js";import"./preload-helper-PPVm8Dsz.js";const a=({visible:r,message:o,onDismiss:n})=>(c.useEffect(()=>{if(!r)return;const i=setTimeout(n,2e3);return()=>clearTimeout(i)},[r,n]),r?t.jsxs("div",{role:"status","aria-live":"polite",className:"pointer-events-none fixed bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-background/95 px-6 py-4 shadow-xl",children:[t.jsx("span",{className:"text-5xl","aria-hidden":"true",children:"🐨"}),t.jsx("p",{className:"text-center text-lg font-semibold",children:o})]}):null);a.__docgenInfo={description:"",methods:[],displayName:"EncouragementAnnouncer",props:{visible:{required:!0,tsType:{name:"boolean"},description:""},message:{required:!0,tsType:{name:"string"},description:""},onDismiss:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const u={component:a,tags:["autodocs"],argTypes:{onDismiss:{action:"dismissed"}}},e={args:{visible:!1,message:"Keep trying!"}},s={args:{visible:!0,message:"Almost! Try again."}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    visible: false,
    message: 'Keep trying!'
  }
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    visible: true,
    message: 'Almost! Try again.'
  }
}`,...s.parameters?.docs?.source}}};const l=["Hidden","Visible"];export{e as Hidden,s as Visible,l as __namedExportsOrder,u as default};
