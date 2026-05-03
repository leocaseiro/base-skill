import{j as e}from"./iframe-BqzUXPvy.js";import{u as n,M as o}from"./blocks-puSEHjmJ.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DQPf7F1I.js";import"./index-BRfDvQf5.js";import"./index-C5-LsQ4V.js";import"./index-CyKHfCS1.js";import"./index-DrFu-skq.js";function t(s){const r={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",ol:"ol",p:"p",pre:"pre",...n(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Library/Distractors"}),`
`,e.jsx(r.h1,{id:"distractors-library",children:"Distractors library"}),`
`,e.jsxs(r.p,{children:[`
  `,`Game-agnostic distractor pipeline used by SpotAll today and reusable by any
  game that needs deterministic, source-pluggable distractor candidates.
`]}),`
`,e.jsx(r.h2,{id:"architecture",children:"Architecture"}),`
`,e.jsx(r.pre,{children:e.jsx(r.code,{className:"language-text",children:`DistractorSource           // produces candidates for a (target, ctx)
  ├── confusable-pairs     // visual confusables from confusable-sets.json
  └── reversible-chars     // self-mirroring R5b set with CSS transforms

registry                   // map of sourceId -> source (auto-registers built-ins)
compose(sources, target, ctx, count, rng?)
                          // merges → dedupes by (label, transform) → shuffles → caps
`})}),`
`,e.jsx(r.h2,{id:"adding-a-new-source",children:"Adding a new source"}),`
`,e.jsxs(r.ol,{children:[`
  `,e.jsxs(r.li,{children:["Create ",e.jsx(r.code,{children:"sources/<id>.ts"})," exporting a ",e.jsx(r.code,{children:"DistractorSource"}),"."]}),`
  `,e.jsxs(r.li,{children:["Append a ",e.jsx(r.code,{children:"registerSource(<source>)"})," line to ",e.jsx(r.code,{children:"registry.ts"}),"."]}),`
  `,e.jsxs(r.li,{children:["Update ",e.jsx(r.code,{children:"DistractorSourceContext"})," if your source reads new selection data."]}),`
`]}),`
`,e.jsxs(r.p,{children:["Future sources tracked in ",e.jsx(r.a,{href:"https://github.com/leocaseiro/base-skill/issues/259",rel:"nofollow",children:"#259"}),"."]})]})}function x(s={}){const{wrapper:r}={...n(),...s.components};return r?e.jsx(r,{...s,children:e.jsx(t,{...s})}):t(s)}export{x as default};
