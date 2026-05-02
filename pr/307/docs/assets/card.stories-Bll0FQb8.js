import{j as r}from"./iframe-DT76eanR.js";import{B as m}from"./button-B05zm3aW.js";import{C as o,a as d,b as c,c as i,d as p,e as C}from"./card-D4E1sKEW.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-BQHNewu7.js";import"./index-DkHeaX7-.js";const y={component:o,title:"UI/Card",tags:["autodocs"],args:{title:"Card Title",description:"Card description goes here.",body:"Card body content.",actionLabel:"Action"},argTypes:{title:{control:"text"},description:{control:"text"},body:{control:"text"},actionLabel:{control:"text"}},render:({title:t,description:s,body:l,actionLabel:n})=>r.jsxs(o,{className:"w-72",children:[r.jsxs(d,{children:[r.jsx(c,{children:t}),r.jsx(p,{children:s})]}),r.jsx(i,{children:r.jsx("p",{children:l})}),r.jsx(C,{children:r.jsx(m,{className:"w-full",children:n})})]})},e={},a={render:({title:t,body:s})=>r.jsxs(o,{className:"w-72",size:"sm",children:[r.jsx(d,{children:r.jsx(c,{children:t})}),r.jsx(i,{children:r.jsx("p",{children:s})})]}),args:{title:"Small Card",body:"Compact variant."}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: ({
    title,
    body
  }) => <Card className="w-72" size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{body}</p>
      </CardContent>
    </Card>,
  args: {
    title: 'Small Card',
    body: 'Compact variant.'
  }
}`,...a.parameters?.docs?.source}}};const f=["Default","Small"];export{e as Default,a as Small,f as __namedExportsOrder,y as default};
