import{r as i,h as p,j as e}from"./iframe-DR_kKzyv.js";import{u as a,M as v}from"./blocks-ApYuJy7V.js";import{B as r}from"./button-B8Vgge0q.js";import"./preload-helper-PPVm8Dsz.js";import"./index-vnwDxY2M.js";import"./index-BsEgwc4q.js";import"./index-DtFEjIQS.js";import"./index-BI0jEWE0.js";import"./index-DrFu-skq.js";import"./utils-BQHNewu7.js";import"./index-BVcr8S5-.js";const c={gameId:"demo",sessionId:"demo-session",profileId:"anonymous",timestamp:Date.now(),roundIndex:0},l=()=>{const t=i.useRef(p()),[n,m]=i.useState([]);i.useEffect(()=>t.current.subscribe("game:*",o=>{m(j=>[`[${o.type}] ${JSON.stringify(o)}`,...j.slice(0,9)])}),[]);const u=()=>{const s={type:"game:start",...c,locale:"en",difficulty:"easy",gradeBand:"k"};t.current.emit(s)},h=()=>{const s={type:"game:end",...c,finalScore:0,totalRounds:1,correctCount:0,durationMs:0,retryCount:0};t.current.emit(s)},x=()=>{const s={type:"game:instructions_shown",...c};t.current.emit(s)};return e.jsxs("div",{className:"flex flex-col gap-4 p-4",children:[e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(r,{size:"sm",onClick:u,children:"Emit game:start"}),e.jsx(r,{size:"sm",onClick:h,children:"Emit game:end"}),e.jsx(r,{size:"sm",onClick:x,children:"Emit game:instructions_shown"})]}),e.jsx("div",{className:"rounded border p-2 font-mono text-xs",children:n.length===0?e.jsx("span",{className:"text-muted-foreground",children:"No events yet — click a button above."}):n.map(s=>e.jsx("div",{children:s},s))})]})};l.__docgenInfo={description:"",methods:[],displayName:"GameEventBusDemo"};function d(t){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...a(),...t.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(v,{title:"Services/GameEventBus"}),`
`,e.jsx(n.h1,{id:"gameeventbus",children:"GameEventBus"}),`
`,e.jsx(n.p,{children:"A typed pub/sub event bus for coordinating game engine events."}),`
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
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"createGameEventBus"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"() => GameEventBus"})}),`
      `,e.jsx(n.td,{children:"Creates a new event bus instance"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"getGameEventBus"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"() => GameEventBus"})}),`
      `,e.jsx(n.td,{children:"Returns the process-wide singleton"}),`
    `]}),`
  `]})]}),`
`,e.jsxs(n.h3,{id:"gameeventbus-interface",children:[e.jsx(n.code,{children:"GameEventBus"})," interface"]}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"emit(event: GameEvent): void"})," — broadcasts to all wildcard + type-specific subscribers"]}),`
  `,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"subscribe(type: GameEventType | 'game:*', handler): () => void"})," — returns unsubscribe function"]}),`
`]}),`
`,e.jsx(n.h2,{id:"interactive-demo",children:"Interactive Demo"}),e.jsx(l,{})]})}function M(t={}){const{wrapper:n}={...a(),...t.components};return n?e.jsx(n,{...t,children:e.jsx(d,{...t})}):d(t)}export{M as default};
