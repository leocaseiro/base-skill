import{r as c,j as e}from"./iframe-C4FjqD4A.js";import{u as d,M as u}from"./blocks-D75GjDl8.js";import{B as x}from"./button-DrkXztCs.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DdffNlDu.js";import"./index-BgEDZJq2.js";import"./index-Da7vPXkj.js";import"./index-C7YGcXZL.js";import"./index-DrFu-skq.js";import"./utils-BQHNewu7.js";import"./index-BOsn4Y5q.js";function j(){if(!("window"in globalThis))return null;const t=globalThis.SpeechRecognition,n=globalThis.webkitSpeechRecognition,s=t??n;return s?new s:null}function m(){if(!("window"in globalThis))return!1;const t=globalThis;return!!(t.SpeechRecognition??t.webkitSpeechRecognition)}const h=()=>{const[t,n]=c.useState(""),[s,r]=c.useState(!1);if(!m())return e.jsx("p",{className:"text-muted-foreground text-sm",children:"Speech recognition is not available in this browser."});const a=()=>{const i=j();i&&(i.lang="en-US",i.continuous=!1,i.interimResults=!1,i.onresult=p=>{const o=p.results[0]?.[0];o&&n(o.transcript)},i.onend=()=>r(!1),i.onerror=()=>r(!1),i.start(),r(!0))};return e.jsxs("div",{className:"flex flex-col gap-3 p-4",children:[e.jsx(x,{onClick:a,disabled:s,children:s?"Listening…":"Start listening"}),t&&e.jsxs("p",{className:"rounded border p-2 text-sm",children:[e.jsx("strong",{children:"Heard:"})," ",t]})]})};h.__docgenInfo={description:"",methods:[],displayName:"SpeechInputDemo"};function l(t){const n={code:"code",h1:"h1",h2:"h2",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...d(),...t.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(u,{title:"Services/SpeechInput"}),`
`,e.jsx(n.h1,{id:"speechinput",children:"SpeechInput"}),`
`,e.jsxs(n.p,{children:["Wraps the browser's ",e.jsx(n.code,{children:"SpeechRecognition"})," / ",e.jsx(n.code,{children:"webkitSpeechRecognition"})," API. Returns ",e.jsx(n.code,{children:"null"})," when unavailable."]}),`
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
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"createSpeechRecognition"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"() => SpeechRecognitionLike | null"})}),`
      `,e.jsxs(n.td,{children:["Creates a recognition instance, or ",e.jsx(n.code,{children:"null"})," if API is missing"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"isSpeechInputAvailable"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"() => boolean"})}),`
      `,e.jsxs(n.td,{children:["Returns ",e.jsx(n.code,{children:"true"})," if the API is available"]}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.h2,{id:"interactive-demo",children:"Interactive Demo"}),e.jsx(h,{})]})}function T(t={}){const{wrapper:n}={...d(),...t.components};return n?e.jsx(n,{...t,children:e.jsx(l,{...t})}):l(t)}export{T as default};
