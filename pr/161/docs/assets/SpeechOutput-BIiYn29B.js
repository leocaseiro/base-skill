import{r as o,j as e}from"./iframe-tauurkDR.js";import{u as i,M as h}from"./blocks-DQAEed90.js";import{a as l,s as a,c as p}from"./SpeechOutput-Dyw1q0Rq.js";import{B as s}from"./button-D0knDdgf.js";import{I as x}from"./input-saRixmHX.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CEhCxiZX.js";import"./index-B4NQMhfr.js";import"./index-DlUHTGap.js";import"./index-DOZ79xFA.js";import"./index-DrFu-skq.js";import"./safe-get-voices-dEfMv828.js";import"./utils-BQHNewu7.js";import"./index-DwbWrQ-l.js";const c=()=>{const[n,t]=o.useState("Hello, world!");return l()?e.jsxs("div",{className:"flex flex-col gap-3 p-4",children:[e.jsx(x,{value:n,onChange:d=>t(d.target.value),placeholder:"Text to speak","aria-label":"Text to speak"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(s,{onClick:()=>a(n),children:"Speak"}),e.jsx(s,{variant:"outline",onClick:p,children:"Cancel"})]})]}):e.jsx("p",{className:"text-muted-foreground text-sm",children:"Speech synthesis is not available in this browser."})};c.__docgenInfo={description:"",methods:[],displayName:"SpeechOutputDemo"};function r(n){const t={code:"code",h1:"h1",h2:"h2",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...i(),...n.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(h,{title:"Services/SpeechOutput"}),`
`,e.jsx(t.h1,{id:"speechoutput",children:"SpeechOutput"}),`
`,e.jsxs(t.p,{children:["Wraps the browser's ",e.jsx(t.code,{children:"SpeechSynthesis"})," API. Gracefully degrades when the API is unavailable."]}),`
`,e.jsx(t.h2,{id:"api",children:"API"}),`
`,e.jsxs(t.table,{children:[`
  `,e.jsxs(t.thead,{children:[`
    `,e.jsxs(t.tr,{children:[`
      `,e.jsx(t.th,{children:"Function"}),`
      `,e.jsx(t.th,{children:"Signature"}),`
      `,e.jsx(t.th,{children:"Description"}),`
    `]}),`
  `]}),`
  `,e.jsxs(t.tbody,{children:[`
    `,e.jsxs(t.tr,{children:[`
      `,e.jsx(t.td,{children:e.jsx(t.code,{children:"speak"})}),`
      `,e.jsx(t.td,{children:e.jsx(t.code,{children:"(text: string) => void"})}),`
      `,e.jsx(t.td,{children:"Cancels any current speech, then speaks the given text"}),`
    `]}),`
    `,e.jsxs(t.tr,{children:[`
      `,e.jsx(t.td,{children:e.jsx(t.code,{children:"cancelSpeech"})}),`
      `,e.jsx(t.td,{children:e.jsx(t.code,{children:"() => void"})}),`
      `,e.jsx(t.td,{children:"Stops any in-progress speech"}),`
    `]}),`
    `,e.jsxs(t.tr,{children:[`
      `,e.jsx(t.td,{children:e.jsx(t.code,{children:"isSpeechOutputAvailable"})}),`
      `,e.jsx(t.td,{children:e.jsx(t.code,{children:"() => boolean"})}),`
      `,e.jsxs(t.td,{children:["Returns ",e.jsx(t.code,{children:"true"})," if ",e.jsx(t.code,{children:"window.speechSynthesis"})," exists"]}),`
    `]}),`
  `]})]}),`
`,e.jsx(t.h2,{id:"interactive-demo",children:"Interactive Demo"}),e.jsx(c,{})]})}function M(n={}){const{wrapper:t}={...i(),...n.components};return t?e.jsx(t,{...n,children:e.jsx(r,{...n})}):r(n)}export{M as default};
