import{r as h,j as e,B as s}from"./iframe-CRLeYpkl.js";import{u as r,M as l}from"./blocks-DpcMl2kf.js";import{a as o,s as a,c as x}from"./SpeechOutput-Dyw1q0Rq.js";import{I as p}from"./input-BuiLF1jY.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DrFu-skq.js";import"./safe-get-voices-dEfMv828.js";const i=()=>{const[t,n]=h.useState("Hello, world!");return o()?e.jsxs("div",{className:"flex flex-col gap-3 p-4",children:[e.jsx(p,{value:t,onChange:d=>n(d.target.value),placeholder:"Text to speak","aria-label":"Text to speak"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(s,{onClick:()=>a(t),children:"Speak"}),e.jsx(s,{variant:"outline",onClick:x,children:"Cancel"})]})]}):e.jsx("p",{className:"text-muted-foreground text-sm",children:"Speech synthesis is not available in this browser."})};i.__docgenInfo={description:"",methods:[],displayName:"SpeechOutputDemo"};function c(t){const n={code:"code",h1:"h1",h2:"h2",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...r(),...t.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(l,{title:"Services/SpeechOutput"}),`
`,e.jsx(n.h1,{id:"speechoutput",children:"SpeechOutput"}),`
`,e.jsxs(n.p,{children:["Wraps the browser's ",e.jsx(n.code,{children:"SpeechSynthesis"})," API. Gracefully degrades when the API is unavailable."]}),`
`,e.jsx(n.h2,{id:"api",children:"API"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Function"}),`
      `,e.jsx(n.th,{children:"Signature"}),`
      `,e.jsx(n.th,{children:"Description"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"speak"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"(text: string) => void"})}),`
      `,e.jsx(n.td,{children:"Cancels any current speech, then speaks the given text"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"cancelSpeech"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"() => void"})}),`
      `,e.jsx(n.td,{children:"Stops any in-progress speech"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"isSpeechOutputAvailable"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"() => boolean"})}),`
      `,e.jsxs(n.td,{children:["Returns ",e.jsx(n.code,{children:"true"})," if ",e.jsx(n.code,{children:"window.speechSynthesis"})," exists"]}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.h2,{id:"interactive-demo",children:"Interactive Demo"}),e.jsx(i,{})]})}function g(t={}){const{wrapper:n}={...r(),...t.components};return n?e.jsx(n,{...t,children:e.jsx(c,{...t})}):c(t)}export{g as default};
