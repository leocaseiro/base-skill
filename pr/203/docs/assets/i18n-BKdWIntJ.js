import{j as n}from"./iframe-sw-yh6LZ.js";import{u as r,M as d}from"./blocks-Bd1kejeE.js";import"./preload-helper-PPVm8Dsz.js";import"./index-Bmb3alKB.js";import"./index-CytqsvgH.js";import"./index-BTN6FgrS.js";import"./index-DdPBDLqW.js";import"./index-DrFu-skq.js";function t(s){const e={code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...r(),...s.components};return n.jsxs(n.Fragment,{children:[`
`,`
`,n.jsx(d,{title:"Utils/i18n"}),`
`,n.jsx(e.h1,{id:"i18n",children:"i18n"}),`
`,n.jsxs(e.p,{children:["Internationalisation setup using ",n.jsx(e.code,{children:"i18next"})," + ",n.jsx(e.code,{children:"react-i18next"}),"."]}),`
`,n.jsx(e.h2,{id:"supported-locales",children:"Supported locales"}),`
`,n.jsxs(e.table,{children:[`
  `,n.jsxs(e.thead,{children:[`
    `,n.jsxs(e.tr,{children:[`
      `,n.jsx(e.th,{children:"Code"}),`
      `,n.jsx(e.th,{children:"Language"}),`
    `]}),`
  `]}),`
  `,n.jsxs(e.tbody,{children:[`
    `,n.jsxs(e.tr,{children:[`
      `,n.jsx(e.td,{children:n.jsx(e.code,{children:"en"})}),`
      `,n.jsx(e.td,{children:"English (default)"}),`
    `]}),`
    `,n.jsxs(e.tr,{children:[`
      `,n.jsx(e.td,{children:n.jsx(e.code,{children:"pt-BR"})}),`
      `,n.jsx(e.td,{children:"Brazilian Portuguese"}),`
    `]}),`
  `]})]}),`
`,n.jsx(e.h2,{id:"namespaces",children:"Namespaces"}),`
`,n.jsxs(e.table,{children:[`
  `,n.jsxs(e.thead,{children:[`
    `,n.jsxs(e.tr,{children:[`
      `,n.jsx(e.th,{children:"Namespace"}),`
      `,n.jsx(e.th,{children:"Keys"}),`
    `]}),`
  `]}),`
  `,n.jsxs(e.tbody,{children:[`
    `,n.jsxs(e.tr,{children:[`
      `,n.jsx(e.td,{children:n.jsx(e.code,{children:"common"})}),`
      `,n.jsx(e.td,{children:"App name, nav labels, pagination, search, levels, offline banner"}),`
    `]}),`
    `,n.jsxs(e.tr,{children:[`
      `,n.jsx(e.td,{children:n.jsx(e.code,{children:"games"})}),`
      `,n.jsxs(e.td,{children:["Game title keys (e.g. ",n.jsx(e.code,{children:"word-spell"}),")"]}),`
    `]}),`
    `,n.jsxs(e.tr,{children:[`
      `,n.jsx(e.td,{children:n.jsx(e.code,{children:"settings"})}),`
      `,n.jsx(e.td,{children:"Settings page labels"}),`
    `]}),`
    `,n.jsxs(e.tr,{children:[`
      `,n.jsx(e.td,{children:n.jsx(e.code,{children:"encouragements"})}),`
      `,n.jsx(e.td,{children:"Positive feedback messages"}),`
    `]}),`
  `]})]}),`
`,n.jsx(e.h2,{id:"usage-in-components",children:"Usage in components"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-tsx",children:`import { useTranslation } from 'react-i18next';

const { t } = useTranslation('common');
// t('appName') → 'BaseSkill'
// t('levels.K') → 'Kindergarten'
`})}),`
`,n.jsxs(e.p,{children:[`
  `,"The locale is driven by the URL parameter ",n.jsx(e.code,{children:"/$locale"}),". Components call ",n.jsx(e.code,{children:"useTranslation"}),` directly;
  they do not read the locale from i18next config at runtime — the router renders the right locale subtree.
`]})]})}function m(s={}){const{wrapper:e}={...r(),...s.components};return e?n.jsx(e,{...s,children:n.jsx(t,{...s})}):t(s)}export{m as default};
