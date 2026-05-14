import{r as t}from"./iframe-lanmD6_3.js";function o(e,s){const[u,r]=t.useState(s);return t.useEffect(()=>{const n=e.subscribe({next:a=>r(a)});return()=>n.unsubscribe()},[e]),u}export{o as u};
