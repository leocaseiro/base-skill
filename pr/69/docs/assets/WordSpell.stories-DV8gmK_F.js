import{w as K}from"./withDb-y9PlQdad.js";import{c as X,w as Y}from"./withRouter-uU3qsqHx.js";import{r as p,j as l}from"./iframe-fwRAajYu.js";import{n as U}from"./index.browser-BY9c7rfI.js";import{L as ee}from"./LetterTileBank-BKfumpHR.js";import{_ as u}from"./preload-helper-PPVm8Dsz.js";import{A as I}from"./AnswerGame-dsj6E9xx.js";import{G as oe}from"./GameOverOverlay-CF4c5q3p.js";import{S as se}from"./ScoreAnimation-C3pAMyLG.js";import{S as re}from"./SentenceWithGaps-CEWm5B1w.js";import{S as te,a as ne}from"./SlotRow-avqGR7zO.js";import{a as ae,u as le}from"./AnswerGameProvider-ByNPyt3J.js";import{b as ie,u as ce,a as ue}from"./build-round-order-nalZU0yt.js";import{A as de}from"./AudioButton-DdSJ8g5b.js";import{u as me}from"./useGameTTS-DnbrEutd.js";import{I as pe}from"./ImageQuestion-CaWiTwob.js";import"./DbProvider-CA_45L6R.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DNSWxYgF.js";import"./index-8iMLftLb.js";import"./index-CJduMu_-.js";import"./useTouchDrag-ByrY8kN0.js";import"./useDraggableTile-C1Sb_vPQ.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-CBzGrPme.js";import"./createLucideIcon-BSr-0UM3.js";import"./useSettings-DMQr_6LU.js";import"./useRxDB-BOFGlrXt.js";import"./useRxQuery-7JSXOpM9.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-CKiZkD3p.js";const ge=e=>{for(let o=e.length-1;o>0;o--){const t=Math.floor(Math.random()*(o+1));[e[o],e[t]]=[e[t],e[o]]}},H=e=>{const o=e.map((s,a)=>({id:`z${a}`,index:a,expectedValue:s.word,placedTileId:null,isWrong:!1,isLocked:!1})),t=[...e.map(s=>s.word),...e.flatMap(s=>s.distractors??[])];return ge(t),{tiles:t.map(s=>({id:U(),label:s,value:s})),zones:o}},fe={sh:"ʃ",ch:"tʃ",th_voiceless:"θ",th_voiced:"ð",ng:"ŋ",zh:"ʒ",oo_long:"uː",oo_short:"ʊ",schwa:"ə"};Object.fromEntries(Object.entries(fe).map(([e,o])=>[o,e]));const G=(e,[o,t])=>e>=o&&e<=t,N=(e,o)=>{if(e.region!==o.region||o.level!==void 0&&e.level!==o.level||o.levels&&!o.levels.includes(e.level)||o.levelRange&&!G(e.level,o.levelRange)||o.syllableCountEq!==void 0&&e.syllableCount!==o.syllableCountEq||o.syllableCountRange&&!G(e.syllableCount,o.syllableCountRange))return!1;if(!(o.graphemesAllowed!==void 0||o.graphemesRequired!==void 0||o.phonemesAllowed!==void 0||o.phonemesRequired!==void 0))return!0;if(!e.graphemes)return!1;if(o.graphemesAllowed){const r=new Set(o.graphemesAllowed);if(!e.graphemes.every(s=>r.has(s.g)))return!1}if(o.graphemesRequired){const r=new Set(o.graphemesRequired);if(!e.graphemes.some(s=>r.has(s.g)))return!1}if(o.phonemesAllowed){const r=new Set(o.phonemesAllowed);if(!e.graphemes.every(s=>r.has(s.p)))return!1}if(o.phonemesRequired){const r=new Set(o.phonemesRequired);if(!e.graphemes.some(s=>r.has(s.p)))return!1}return!0},he=Object.assign({"./core/level1.json":()=>u(()=>import("./level1-DJfjupwe.js"),[],import.meta.url),"./core/level2.json":()=>u(()=>import("./level2-CNbd3OOg.js"),[],import.meta.url),"./core/level3.json":()=>u(()=>import("./level3-75Hon_we.js"),[],import.meta.url),"./core/level4.json":()=>u(()=>import("./level4-DYt701kd.js"),[],import.meta.url),"./core/level5.json":()=>u(()=>import("./level5-Bx2JUlZH.js"),[],import.meta.url),"./core/level6.json":()=>u(()=>import("./level6-BZoypSzF.js"),[],import.meta.url),"./core/level7.json":()=>u(()=>import("./level7-BhUqTymI.js"),[],import.meta.url),"./core/level8.json":()=>u(()=>import("./level8-BSTAg1oc.js"),[],import.meta.url)}),_e=Object.assign({"./curriculum/aus/level1.json":()=>u(()=>import("./level1-D63acf7B.js"),[],import.meta.url),"./curriculum/aus/level2.json":()=>u(()=>import("./level2-1WtYUdRi.js"),[],import.meta.url),"./curriculum/aus/level3.json":()=>u(()=>import("./level3-CETB5V8h.js"),[],import.meta.url),"./curriculum/aus/level4.json":()=>u(()=>import("./level4-DOBScsVy.js"),[],import.meta.url),"./curriculum/aus/level5.json":()=>u(()=>import("./level5-BVQxeEUp.js"),[],import.meta.url),"./curriculum/aus/level6.json":()=>u(()=>import("./level6-D4eq0fBu.js"),[],import.meta.url),"./curriculum/aus/level7.json":()=>u(()=>import("./level7-BJPr6AhI.js"),[],import.meta.url),"./curriculum/aus/level8.json":()=>u(()=>import("./level8-CqW0aGbF.js"),[],import.meta.url)}),ve=Object.assign({}),be=Object.assign({}),we=Object.assign({}),xe=e=>{switch(e){case"aus":return _e;case"uk":return ve;case"us":return be;case"br":return we}};let P=null;const D={},je=async()=>{if(P)return P;const e=new Map,o=await Promise.all(Object.values(he).map(t=>t()));for(const t of o)for(const r of t.default)e.set(r.word,r);return P=e,e},z=async e=>{if(D[e])return D[e];const t=(await Promise.all(Object.values(xe(e)).map(r=>r()))).flatMap(r=>r.default);return D[e]=t,t},F=(e,o,t)=>e.flatMap(r=>{const s=o.get(r.word);return s?[{word:r.word,region:t,level:r.level,syllableCount:s.syllableCount,syllables:s.syllables,variants:s.variants,ipa:r.ipa||void 0,graphemes:r.graphemes}]:[]}),Ee=async e=>{const o=await je(),t=await z(e.region),r=F(t,o,e.region).filter(n=>N(n,e));if(r.length>0||e.region==="aus"||e.fallbackToAus===!1)return{hits:r};const s=await z("aus");return{hits:F(s,o,"aus").filter(n=>N(n,{...e,region:"aus"})),usedFallback:{from:e.region,to:"aus"}}},Re=e=>({word:e.syllables?e.syllables.join("-"):e.word}),ye=e=>e.source?{rounds:[],isLoading:!0}:{rounds:e.rounds??[],isLoading:!1},Te=e=>{const[o,t]=p.useState(()=>ye(e));return p.useEffect(()=>{if(e.rounds&&e.rounds.length>0){const a=e.rounds;t(n=>n.rounds===a&&!n.isLoading&&n.usedFallback===void 0?n:{rounds:a,isLoading:!1});return}const r=e.source;if(!r){t(a=>a.rounds.length===0&&!a.isLoading&&a.usedFallback===void 0?a:{rounds:[],isLoading:!1});return}const s={isCancelled:!1};return t(a=>a.isLoading?a:{...a,isLoading:!0}),(async()=>{const a=await Ee(r.filter);if(s.isCancelled)return;const n=r.limit??e.totalRounds,i=a.hits.slice(0,n).map(d=>Re(d));t({rounds:i,isLoading:!1,usedFallback:a.usedFallback})})(),()=>{s.isCancelled=!0}},[e.rounds,e.source,e.totalRounds]),o},Z=({emoji:e,prompt:o})=>{const{speakPrompt:t}=me();return l.jsx("button",{type:"button","aria-label":`${o} — tap to hear`,className:"rounded-xl p-2 focus-visible:outline-2 focus-visible:outline-offset-2",onClick:()=>t(o),children:l.jsx("span",{className:"block text-[7rem] leading-none select-none","aria-hidden":"true",children:e})})};Z.__docgenInfo={description:"",methods:[],displayName:"EmojiQuestion",props:{emoji:{required:!0,tsType:{name:"string"},description:"One or more code points (e.g. a single emoji or a ZWJ sequence)."},prompt:{required:!0,tsType:{name:"string"},description:""}}};function Ie(e,o){const t=e.trim();if(o==="word")return[t];if(o==="syllable"){const r=t.split(/[-\s]+/).filter(Boolean);return r.length>0?r:[t]}return[...t.toLowerCase()]}function Q(e,o){const r=Ie(e,o).map(i=>o==="letter"?i.toLowerCase():i.toUpperCase()),s=r.map((i,d)=>({id:`z${d}`,index:d,expectedValue:i,placedTileId:null,isWrong:!1,isLocked:!1}));return{tiles:[...r].toSorted((i,d)=>i.localeCompare(d)).map(i=>({id:U(),label:i,value:i})),zones:s}}const Le=({wordSpellConfig:e,roundOrder:o,onRestartSession:t})=>{const{phase:r,roundIndex:s,retryCount:a,zones:n}=ae(),i=le(),{confettiReady:d,gameOverReady:L}=ce(),_=X(),h=p.useRef(0),m=p.useMemo(()=>e.rounds??[],[e.rounds]),g=o[s],c=g===void 0?void 0:m[g];ue(c?.word??"");const v=()=>{_({to:"/$locale",params:{locale:"en"}})},M=()=>{t()};if(p.useEffect(()=>{if(r!=="round-complete"||!d)return;const O=++h.current,S=globalThis.setTimeout(()=>{if(h.current!==O)return;if(s>=o.length-1){i({type:"COMPLETE_GAME"});return}const W=o[s+1],b=W===void 0?void 0:m[W],q=b?.word.trim()??"";if(!q){i({type:"COMPLETE_GAME"});return}if(b?.gaps&&b.gaps.length>0){const{tiles:A,zones:k}=H(b.gaps);i({type:"ADVANCE_ROUND",tiles:A,zones:k})}else{const{tiles:A,zones:k}=Q(q,e.tileUnit);i({type:"ADVANCE_ROUND",tiles:A,zones:k})}},750);return()=>{globalThis.clearTimeout(S)}},[r,d,s,i,o,m,e.tileUnit]),!c)return null;const C=e.mode!=="recall"&&!!c.emoji?.trim(),B=c.sceneImage??c.image,J=e.mode!=="recall"&&!!B;return l.jsxs(l.Fragment,{children:[l.jsxs("div",{className:"flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6",children:[l.jsxs(I.Question,{children:[e.mode==="sentence-gap"&&c.sentence?c.gaps&&c.gaps.length>0?l.jsx(re,{sentence:c.sentence,className:"max-w-md text-center text-foreground"}):l.jsx("p",{className:"max-w-md text-center text-lg text-foreground",children:c.sentence}):null,C?l.jsx(Z,{emoji:c.emoji.trim(),prompt:c.word}):J?l.jsx(pe,{src:B,prompt:c.word}):null,l.jsx(de,{prompt:c.word})]}),l.jsx(I.Answer,{children:c.gaps&&c.gaps.length>0?null:l.jsx(te,{className:"gap-2",children:n.map((O,V)=>l.jsx(ne,{index:V,className:"size-14 rounded-lg",children:({label:S})=>l.jsx("span",{className:"text-2xl font-bold",children:S})},O.id))})}),l.jsx(I.Choices,{children:l.jsx(ee,{})})]}),l.jsx(se,{visible:d}),L?l.jsx(oe,{retryCount:a,onPlayAgain:M,onHome:v}):null]})},$=({config:e,initialState:o,sessionId:t,seed:r})=>{const{rounds:s,isLoading:a}=Te(e),n=p.useMemo(()=>({...e,rounds:s}),[e,s]),i=n.roundsInOrder===!0,[d,L]=p.useState(0),_=p.useMemo(()=>ie(s.length,i,r),[s.length,i,r,d]),h=_[0],m=h===void 0?void 0:s[h],g=m?.word.trim()?m.word:"",{tiles:c,zones:v}=p.useMemo(()=>g?m?.gaps&&m.gaps.length>0?H(m.gaps):Q(g,n.tileUnit):{tiles:[],zones:[]},[g,n.tileUnit,m]),M=p.useMemo(()=>({gameId:n.gameId,inputMethod:n.inputMethod,wrongTileBehavior:n.wrongTileBehavior,tileBankMode:n.tileBankMode,distractorCount:n.distractorCount,totalRounds:s.length,roundsInOrder:n.roundsInOrder,ttsEnabled:n.ttsEnabled,touchKeyboardInputMode:"text",initialTiles:c,initialZones:v,slotInteraction:n.mode==="scramble"||n.mode==="sentence-gap"?"free-swap":"ordered"}),[n.gameId,n.inputMethod,n.wrongTileBehavior,n.tileBankMode,n.distractorCount,s.length,n.roundsInOrder,n.ttsEnabled,n.mode,c,v]);return a?l.jsx("div",{role:"status",className:"flex min-h-[200px] w-full items-center justify-center text-foreground",children:"Loading words…"}):m?l.jsx(I,{config:M,initialState:d===0?o:void 0,sessionId:t,children:l.jsx(Le,{wordSpellConfig:n,roundOrder:_,onRestartSession:()=>{L(C=>C+1)}})},d):null};$.__docgenInfo={description:"",methods:[],displayName:"WordSpell",props:{config:{required:!0,tsType:{name:"WordSpellConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const f={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},uo={component:$,tags:["autodocs"],args:{config:f},decorators:[K,Y]},w={},x={args:{config:{...f,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},j={args:{config:{...f,mode:"scramble"}}},E={args:{config:{...f,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},R={args:{config:{...f,tileBankMode:"distractors",distractorCount:3}}},y={args:{config:{...f,wrongTileBehavior:"lock-manual"}}},T={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!1,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:"{}",...w.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'recall',
      tileBankMode: 'distractors',
      distractorCount: 4,
      rounds: [{
        word: 'cat'
      }]
    }
  }
}`,...x.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'scramble'
    }
  }
}`,...j.parameters?.docs?.source}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'sentence-gap',
      rounds: [{
        word: 'sat',
        image: 'https://placehold.co/160?text=scene',
        sentence: 'The cat ___ on the mat.'
      }]
    }
  }
}`,...E.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractorCount: 3
    }
  }
}`,...R.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      wrongTileBehavior: 'lock-manual'
    }
  }
}`,...y.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      gameId: 'word-spell-library-sourced',
      component: 'WordSpell',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 4,
      roundsInOrder: true,
      ttsEnabled: false,
      mode: 'recall',
      tileUnit: 'letter',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          levels: [1, 2],
          syllableCountEq: 1
        }
      }
    }
  }
}`,...T.parameters?.docs?.source}}};const mo=["PictureMode","RecallMode","ScrambleMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{T as LibrarySourced,y as LockManualWrongTile,w as PictureMode,x as RecallMode,j as ScrambleMode,E as SentenceGapMode,R as WithDistractors,mo as __namedExportsOrder,uo as default};
