import{j as e}from"./iframe-DEUDvh5x.js";import{u as i,M as l}from"./blocks-DE2THcsh.js";import"./preload-helper-PPVm8Dsz.js";import"./index-ghZkdvNX.js";import"./index-DIQLqozR.js";import"./index-D5JSBNjL.js";import"./index-glJpUxzL.js";import"./index-DrFu-skq.js";function a(n){const t={code:"code",h1:"h1",h2:"h2",h3:"h3",p:"p",pre:"pre",...i(),...n.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(l,{title:"Utils/CatalogUtils"}),`
`,e.jsx(t.h1,{id:"catalogutils",children:"CatalogUtils"}),`
`,e.jsx(t.p,{children:"Pure filter and pagination utilities for the game catalog. No side effects, no DB required."}),`
`,e.jsx(t.h2,{id:"api",children:"API"}),`
`,e.jsx(t.h3,{id:"filtercatalogcatalog-gamecatalogentry-filter-catalogfilter-gamecatalogentry",children:e.jsx(t.code,{children:"filterCatalog(catalog: GameCatalogEntry[], filter: CatalogFilter): GameCatalogEntry[]"})}),`
`,e.jsxs(t.p,{children:[`
  `,"Filters by ",e.jsx(t.code,{children:"level"}),", ",e.jsx(t.code,{children:"subject"}),", and ",e.jsx(t.code,{children:"search"})," (case-insensitive substring match on ",e.jsx(t.code,{children:"titleKey"}),`).
  All filter fields are optional — empty string or empty value means "no filter".
`]}),`
`,e.jsx(t.pre,{children:e.jsx(t.code,{className:"language-ts",children:`type CatalogFilter = {
  search: string;
  level: GameLevel | '';
  subject: GameSubject | '';
};
`})}),`
`,e.jsx(t.h3,{id:"paginatecatalogtitems-t-page-number-pagesize-number-paginateresultt",children:e.jsx(t.code,{children:"paginateCatalog<T>(items: T[], page: number, pageSize: number): PaginateResult<T>"})}),`
`,e.jsxs(t.p,{children:["Returns a page slice. ",e.jsx(t.code,{children:"page"})," is 1-indexed and clamped to ",e.jsx(t.code,{children:"[1, totalPages]"}),"."]}),`
`,e.jsx(t.pre,{children:e.jsx(t.code,{className:"language-ts",children:`type PaginateResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
};
`})})]})}function h(n={}){const{wrapper:t}={...i(),...n.components};return t?e.jsx(t,{...n,children:e.jsx(a,{...n})}):a(n)}export{h as default};
