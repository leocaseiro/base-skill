import{j as n}from"./iframe-B4y-rYw4.js";import{u as t,M as i}from"./blocks-B02MJ8IW.js";import"./preload-helper-PPVm8Dsz.js";import"./index-NipIdMy_.js";import"./index-D8UJCyhD.js";import"./index-DyU1-vkJ.js";import"./index-lnIEzAmi.js";import"./index-DrFu-skq.js";function r(o){const e={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...t(),...o.components};return n.jsxs(n.Fragment,{children:[n.jsx(i,{title:"Components/PhonemeBlender/Flows"}),`
`,n.jsx(e.h1,{id:"phonemeblender--interaction-flows",children:"PhonemeBlender — Interaction Flows"}),`
`,n.jsxs(e.blockquote,{children:[`
  `,n.jsxs(e.p,{children:["Source: ",n.jsx(e.code,{children:"src/components/phoneme-blender/"})]}),`
`]}),`
`,n.jsx(e.h2,{id:"1-pointer-scrub-across-zones",children:"1. Pointer scrub across zones"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant Track as role="slider" div
  participant Comp as PhonemeBlender
  participant Audio as phoneme-audio

  User->>Track: pointerdown
  Track->>Comp: onPointerDown
  Comp->>Comp: firedStops.clear(), passed.clear()
  Comp->>Comp: zoneFromMs(ms)
  alt zone.loopable
    Comp->>Audio: playPhoneme(p, {sustain:true})
  else stop consonant
    Comp->>Audio: playPhoneme(p)
    Comp->>Comp: firedStops.add(index)
  end
  User->>Track: pointermove (same zone)
  Comp-->>Comp: no-op (index unchanged)
  User->>Track: pointerup
  Comp->>Audio: stopPhoneme()
`})}),`
`,n.jsx(e.h2,{id:"2-auto-play-with-speed-multiplier",children:"2. Auto-play with speed multiplier"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant Btn as Play button
  participant Comp as PhonemeBlender
  participant RAF as requestAnimationFrame
  participant Audio as phoneme-audio

  User->>Btn: click
  Btn->>Comp: startAutoPlay()
  Comp->>Comp: t0 = performance.now()
  loop each frame
    RAF->>Comp: tick()
    Comp->>Comp: elapsed = (now - t0) / multiplier
    alt crossed into new zone
      Comp->>Audio: playPhoneme(p, …)
    end
    alt elapsed >= totalMs
      Comp->>Audio: stopPhoneme()
    end
  end
`})}),`
`,n.jsx(e.h2,{id:"3-stop-on-blur-cross-cutting",children:"3. Stop-on-blur (cross-cutting)"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Browser
  participant Audio as phoneme-audio module

  note over Audio: installAutoStopGuards() on first playPhoneme
  Browser->>Audio: visibilitychange (hidden)
  Audio->>Audio: stopCurrent()
  Browser->>Audio: window blur
  Audio->>Audio: stopCurrent()
  Browser->>Audio: pagehide (iOS)
  Audio->>Audio: stopCurrent()
`})})]})}function h(o={}){const{wrapper:e}={...t(),...o.components};return e?n.jsx(e,{...o,children:n.jsx(r,{...o})}):r(o)}export{h as default};
