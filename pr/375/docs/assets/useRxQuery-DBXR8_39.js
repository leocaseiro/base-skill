import{r as t}from"./iframe-d2Jo5ZDn.js";function o(e,s){const[u,r]=t.useState(s);return t.useEffect(()=>{const n=e.subscribe({next:a=>r(a)});return()=>n.unsubscribe()},[e]),u}export{o as u};
