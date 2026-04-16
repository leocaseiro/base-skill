import{j as e}from"./iframe-PdgXvI7R.js";import{u as d,M as c}from"./blocks-CSSj-c9p.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BTNcHF7B.js";import"./index-CVCWaErs.js";import"./index-ggnWcnI6.js";import"./index-FWfbl_dG.js";import"./index-DrFu-skq.js";function r(s){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...d(),...s.components};return e.jsxs(e.Fragment,{children:[`
`,`
`,e.jsx(c,{title:"Theme/CSS Variables"}),`
`,e.jsx(n.h1,{id:"css-variables",children:"CSS Variables"}),`
`,e.jsx(n.p,{children:"Utilities for applying theme CSS custom properties to DOM elements."}),`
`,e.jsx(n.h2,{id:"api",children:"API"}),`
`,e.jsx(n.h3,{id:"themedoctocssvarsdoc-themedoc-recordstring-string",children:e.jsx(n.code,{children:"themeDocToCssVars(doc: ThemeDoc): Record<string, string>"})}),`
`,e.jsxs(n.p,{children:[`
  `,"Converts a RxDB ",e.jsx(n.code,{children:"ThemeDoc"}),` (user-defined colors) into a CSS vars map, filling in
  static tokens (`,e.jsx(n.code,{children:"--bs-success"}),", ",e.jsx(n.code,{children:"--bs-warning"}),", ",e.jsx(n.code,{children:"--bs-error"}),") from ",e.jsx(n.code,{children:"defaultThemeCssVars"}),`.
`]}),`
`,e.jsx(n.h3,{id:"applythemecssvarselement-htmlelement-vars-recordstring-string-void",children:e.jsx(n.code,{children:"applyThemeCssVars(element: HTMLElement, vars: Record<string, string>): void"})}),`
`,e.jsxs(n.p,{children:[`
  `,"Calls ",e.jsx(n.code,{children:"element.style.setProperty(key, value)"}),` for each entry. Used by the app's theme
  init script and the Storybook `,e.jsx(n.code,{children:"withTheme"}),` decorator.
`]}),`
`,e.jsx(n.h2,{id:"token-reference",children:"Token Reference"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Variable"}),`
      `,e.jsx(n.th,{children:"Default (light)"}),`
      `,e.jsx(n.th,{children:"Role"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"--bs-primary"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"#0077B6"})}),`
      `,e.jsx(n.td,{children:"Primary action colour"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"--bs-secondary"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"#00B4D8"})}),`
      `,e.jsx(n.td,{children:"Secondary / accent"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"--bs-background"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"#EAF6FB"})}),`
      `,e.jsx(n.td,{children:"Page background"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"--bs-surface"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"#FFFFFF"})}),`
      `,e.jsx(n.td,{children:"Card / panel surface"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"--bs-text"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"#023E57"})}),`
      `,e.jsx(n.td,{children:"Body text"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"--bs-accent"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"#FFB703"})}),`
      `,e.jsx(n.td,{children:"Highlight / badge"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"--bs-success"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"#2DC653"})}),`
      `,e.jsx(n.td,{children:"Success state"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"--bs-warning"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"#F4A261"})}),`
      `,e.jsx(n.td,{children:"Warning state"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"--bs-error"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"#E63946"})}),`
      `,e.jsx(n.td,{children:"Error / destructive"}),`
    `]}),`
  `]})]})]})}function m(s={}){const{wrapper:n}={...d(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(r,{...s})}):r(s)}export{m as default};
