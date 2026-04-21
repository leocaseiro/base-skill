import{r as c,j as e}from"./iframe-CBY_CUme.js";import{w as h}from"./withRouter-BgTVBC-2.js";import{u as f}from"./useLocation-pkZd5lXT.js";import"./preload-helper-PPVm8Dsz.js";import"./useNavigate-zlZwV89W.js";import"./index-CtsJEZnv.js";import"./index-CkvJpjHo.js";import"./index-BYBM97wN.js";const i=c.createContext({updateAvailable:!1,applyUpdate:()=>{}}),p=()=>{const{updateAvailable:n,applyUpdate:l}=c.useContext(i),m=f(),[d,u]=c.useState(!1),g=m.pathname.includes("/game/");return!n||g||d?null:e.jsxs("div",{role:"alert",className:"flex items-center justify-between bg-primary px-4 py-2 text-sm text-primary-foreground",children:[e.jsx("span",{children:"New version available — tap to update"}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",className:"underline underline-offset-2",onClick:l,children:"Update"}),e.jsx("button",{type:"button","aria-label":"Dismiss update notification",className:"opacity-70 hover:opacity-100",onClick:()=>u(!0),children:"✕"})]})]})};p.__docgenInfo={description:"",methods:[],displayName:"UpdateBanner"};const b=n=>e.jsx(i.Provider,{value:{updateAvailable:!0,applyUpdate:()=>{}},children:e.jsx(n,{})}),N={component:p,tags:["autodocs"],decorators:[b,h],parameters:{layout:"fullscreen"}},a={},r={parameters:{globals:{theme:"light"}}},t={parameters:{globals:{theme:"dark"}}},s={parameters:{globals:{theme:"forest-light"}}},o={parameters:{globals:{theme:"forest-dark"}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'light'
    }
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'dark'
    }
  }
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'forest-light'
    }
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  parameters: {
    globals: {
      theme: 'forest-dark'
    }
  }
}`,...o.parameters?.docs?.source}}};const w=["Default","OceanLight","OceanDark","ForestLight","ForestDark"];export{a as Default,o as ForestDark,s as ForestLight,t as OceanDark,r as OceanLight,w as __namedExportsOrder,N as default};
