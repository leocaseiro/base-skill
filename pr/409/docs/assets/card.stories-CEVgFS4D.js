import{j as e,B as m}from"./iframe-CRLeYpkl.js";import{C as o,a as d,b as c,c as l,d as p,e as C}from"./card-DV0464k_.js";import"./preload-helper-PPVm8Dsz.js";const u={component:o,title:"UI/Card",tags:["autodocs"],args:{title:"Card Title",description:"Card description goes here.",body:"Card body content.",actionLabel:"Action"},argTypes:{title:{control:"text"},description:{control:"text"},body:{control:"text"},actionLabel:{control:"text"}},render:({title:t,description:s,body:n,actionLabel:i})=>e.jsxs(o,{className:"w-72",children:[e.jsxs(d,{children:[e.jsx(c,{children:t}),e.jsx(p,{children:s})]}),e.jsx(l,{children:e.jsx("p",{children:n})}),e.jsx(C,{children:e.jsx(m,{className:"w-full",children:i})})]})},r={},a={render:({title:t,body:s})=>e.jsxs(o,{className:"w-72",size:"sm",children:[e.jsx(d,{children:e.jsx(c,{children:t})}),e.jsx(l,{children:e.jsx("p",{children:s})})]}),args:{title:"Small Card",body:"Compact variant."}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
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
}`,...a.parameters?.docs?.source}}};const b=["Default","Small"];export{r as Default,a as Small,b as __namedExportsOrder,u as default};
