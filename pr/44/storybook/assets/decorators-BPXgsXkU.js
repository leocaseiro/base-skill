import{j as t,r as a}from"./iframe-shi_d_H9.js";const n=e=>t.jsx("div",{className:"dark",style:{background:"var(--background)",padding:"1rem"},children:t.jsx(e,{})}),d=({Story:e})=>(a.useEffect(()=>(document.documentElement.classList.add("dark"),document.documentElement.dataset.theme="dark",()=>{document.documentElement.classList.remove("dark"),delete document.documentElement.dataset.theme}),[]),t.jsx(e,{})),s=e=>t.jsx(d,{Story:e});n.__docgenInfo={description:`Wraps the story in a dark-mode container.
Use on individual stories that should always render dark,
independently of the global Storybook theme switcher.

Tailwind v4 @custom-variant dark (&:is(.dark *)) means any
.dark ancestor enables dark utility classes on descendants.`,methods:[],displayName:"withDarkMode"};s.__docgenInfo={description:"",methods:[],displayName:"withDocumentDarkMode"};export{s as a,n as w};
