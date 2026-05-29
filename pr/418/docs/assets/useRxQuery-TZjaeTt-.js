import{r,j as e,B as c}from"./iframe-DJm7UBnT.js";import{u as i,M as x}from"./blocks-BSpwHw_k.js";import{u as d}from"./useRxQuery-D45Q3vQw.js";import{S as m}from"./Subject-dqPabvlm.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DrFu-skq.js";const h=({source$:t})=>{const n=d(t,0);return e.jsx("p",{className:"text-2xl font-bold tabular-nums",children:n})},u=()=>{const[t]=r.useState(()=>new m),n=r.useMemo(()=>t.asObservable(),[t]),s=r.useRef(0),a=()=>{s.current+=1,t.next(s.current)},l=()=>{s.current=0,t.next(0)};return e.jsx("div",{className:"flex flex-col gap-3 p-4",children:e.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[e.jsx(h,{source$:n}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(c,{type:"button",onClick:a,children:"Increment"}),e.jsx(c,{type:"button",variant:"outline",onClick:l,children:"Reset"})]})]})})};u.__docgenInfo={description:"",methods:[],displayName:"UseRxQueryDemo"};function o(t){const n={code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...i(),...t.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(x,{title:"DB Hooks/useRxQuery"}),`
`,e.jsx(n.h1,{id:"userxquery",children:"useRxQuery"}),`
`,e.jsxs(n.p,{children:["Generic hook that subscribes to an RxJS ",e.jsx(n.code,{children:"Observable<T>"})," and returns the latest emitted value."]}),`
`,e.jsx(n.h2,{id:"signature",children:"Signature"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`function useRxQuery<T>(source: Observable<T>, initialValue: T): T;
`})}),`
`,e.jsxs(n.p,{children:["Unsubscribes automatically on unmount or when ",e.jsx(n.code,{children:"source"})," changes."]}),`
`,e.jsx(n.h2,{id:"interactive-demo",children:"Interactive Demo"}),`
`,e.jsxs(n.p,{children:["The counter below is driven by a ",e.jsx(n.code,{children:"Subject<number>"}),'. Clicking "Increment" emits a new value; ',e.jsx(n.code,{children:"useRxQuery"})," re-renders with the latest count."]}),e.jsx(u,{})]})}function R(t={}){const{wrapper:n}={...i(),...t.components};return n?e.jsx(n,{...t,children:e.jsx(o,{...t})}):o(t)}export{R as default};
