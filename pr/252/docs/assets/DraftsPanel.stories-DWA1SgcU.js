import{r as a,j as n}from"./iframe-Ch9B8H2U.js";import{D as s}from"./DraftsPanel-Djyl1TLK.js";import{draftStore as o}from"./draftStore-C027uo2C.js";import"./preload-helper-PPVm8Dsz.js";import"./import-wrapper-prod-DHdix99I.js";const m={component:s,title:"Data/Authoring/DraftsPanel",tags:["autodocs"],parameters:{layout:"fullscreen"},args:{open:!0,onClose:()=>{},onEdit:()=>{}},argTypes:{open:{control:"boolean"}}},t={decorators:[e=>(a.useEffect(()=>{o.__clearAllForTests()},[]),n.jsx(e,{}))]},r={decorators:[e=>(a.useEffect(()=>{(async()=>(await o.__clearAllForTests(),await o.saveDraft({word:"putting",region:"aus",level:3,ipa:"pʊtɪŋ",syllables:["put","ting"],syllableCount:2,graphemes:[{g:"p",p:"p"},{g:"u",p:"ʊ"},{g:"tt",p:"t"},{g:"ing",p:"ɪŋ"}],ritaKnown:!0})))()},[]),n.jsx(e,{}))]};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  decorators: [StoryComp => {
    useEffect(() => {
      void draftStore.__clearAllForTests();
    }, []);
    return <StoryComp />;
  }]
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  decorators: [StoryComp => {
    useEffect(() => {
      void (async () => {
        await draftStore.__clearAllForTests();
        await draftStore.saveDraft({
          word: 'putting',
          region: 'aus',
          level: 3,
          ipa: 'pʊtɪŋ',
          syllables: ['put', 'ting'],
          syllableCount: 2,
          graphemes: [{
            g: 'p',
            p: 'p'
          }, {
            g: 'u',
            p: 'ʊ'
          }, {
            g: 'tt',
            p: 't'
          }, {
            g: 'ing',
            p: 'ɪŋ'
          }],
          ritaKnown: true
        });
      })();
    }, []);
    return <StoryComp />;
  }]
}`,...r.parameters?.docs?.source}}};const d=["Empty","WithDrafts"];export{t as Empty,r as WithDrafts,d as __namedExportsOrder,m as default};
