import{j as e}from"./iframe-CBHFxtXJ.js";import{u as o,M as r}from"./blocks-CbpNAHST.js";import{u as c}from"./useSettings-jV4UM25M.js";import{D as d,c as a}from"./DbProvider-CDflZtLP.js";import"./preload-helper-PPVm8Dsz.js";import"./index-pZPeFZKW.js";import"./index-CLq0LaA_.js";import"./index-CVZ3QtXA.js";import"./index-CSJVRelz.js";import"./index-DrFu-skq.js";import"./useRxDB-JyLQOUbB.js";import"./useRxQuery-Azcq6qPY.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";const m=()=>a(),l=()=>{const{settings:n}=c();return e.jsxs("div",{className:"flex flex-col gap-2 p-4 font-mono text-sm",children:[e.jsxs("div",{children:["volume: ",n.volume]}),e.jsxs("div",{children:["speechRate: ",n.speechRate]}),e.jsxs("div",{children:["ttsEnabled: ",String(n.ttsEnabled)]}),e.jsxs("div",{children:["showSubtitles: ",String(n.showSubtitles)]})]})},i=()=>e.jsx(d,{openDatabase:m,children:e.jsx(l,{})});i.__docgenInfo={description:"",methods:[],displayName:"UseSettingsDemo"};function s(n){const t={code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...o(),...n.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(r,{title:"DB Hooks/useSettings"}),`
`,e.jsx(t.h1,{id:"usesettings",children:"useSettings"}),`
`,e.jsx(t.p,{children:"Reactive hook that subscribes to the anonymous profile's settings document in RxDB."}),`
`,e.jsx(t.h2,{id:"return-value",children:"Return value"}),`
`,e.jsxs(t.p,{children:["Returns ",e.jsx(t.code,{children:"{ settings, update }"}),". The ",e.jsx(t.code,{children:"settings"})," object merges defaults with the RxDB document when present."]}),`
`,e.jsx(t.pre,{children:e.jsx(t.code,{className:"language-ts",children:`type SettingsDoc = {
  id: string;
  profileId: string;
  volume: number;
  speechRate: number;
  ttsEnabled: boolean;
  showSubtitles: boolean;
  updatedAt: string;
};
`})}),`
`,e.jsx(t.h2,{id:"interactive-demo",children:"Interactive Demo"}),`
`,e.jsx(t.p,{children:"The demo below uses in-memory RxDB storage — no IndexedDB is touched."}),e.jsx(i,{})]})}function M(n={}){const{wrapper:t}={...o(),...n.components};return t?e.jsx(t,{...n,children:e.jsx(s,{...n})}):s(n)}export{M as default};
